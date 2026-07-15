import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource, EntityManager } from 'typeorm';
import { AuthenticatedPrincipal } from '../../../common/types/authenticated-principal';
import { IDENTITY_READER, USER_STATUS_READER } from '../../identity/contracts/identity.tokens';
import { IdentityReader } from '../../identity/contracts/identity-reader';
import { UserStatusReader } from '../../identity/contracts/user-status-reader';
import { ResolveAttributionContextService } from '../../discovery/application/resolve-attribution-context/resolve-attribution-context.service';
import { BusinessOrmEntity } from '../../organizations/infrastructure/persistence/typeorm/entities/business.orm-entity';
import { CampaignLimitOrmEntity } from '../../campaigns/infrastructure/persistence/typeorm/entities/campaign-limit.orm-entity';
import { CampaignOrmEntity } from '../../campaigns/infrastructure/persistence/typeorm/entities/campaign.orm-entity';
import { ClaimCouponRequestDto } from '../api/dto/coupon.request';
import { ListMyCouponsQueryDto } from '../api/dto/coupon.query';
import {
  CouponDetailsResponseDto,
  CouponPageResponseDto,
} from '../api/dto/coupon.response';
import { TypeOrmCouponRepository } from '../infrastructure/persistence/typeorm/repositories/typeorm-coupon.repository';
import { COUPON_CODE_GENERATOR, CouponCodeGenerator } from '../domain/services/coupon-code-generator';
import {
  COUPON_EXPIRY_CALCULATOR,
  CouponExpiryCalculator,
} from '../domain/services/coupon-expiry-calculator';
import { CouponIssuePolicy } from '../domain/policies/coupon-issue.policy';

@Injectable()
export class CustomerCouponsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly couponRepository: TypeOrmCouponRepository,
    private readonly resolveAttributionContextService: ResolveAttributionContextService,
    @Inject(IDENTITY_READER)
    private readonly identityReader: IdentityReader,
    @Inject(USER_STATUS_READER)
    private readonly userStatusReader: UserStatusReader,
    @Inject(COUPON_CODE_GENERATOR)
    private readonly couponCodeGenerator: CouponCodeGenerator,
    @Inject(COUPON_EXPIRY_CALCULATOR)
    private readonly couponExpiryCalculator: CouponExpiryCalculator,
  ) {}

  async claim(
    campaignId: string,
    body: ClaimCouponRequestDto,
    actor: AuthenticatedPrincipal,
  ): Promise<{ statusCode: 200 | 201; coupon: CouponDetailsResponseDto }> {
    this.ensureCustomerActor(actor);
    await this.ensureActiveUser(actor.id);

    const resolvedSource = await this.resolveAttributionContextService.resolve({
      campaignId,
      trackingToken: body.trackingToken,
      entryPoint: body.entryPoint,
    });

    const result = await this.dataSource.transaction(async (manager) => {
      const campaignRepository = manager.getRepository(CampaignOrmEntity);
      const businessRepository = manager.getRepository(BusinessOrmEntity);
      const limitRepository = manager.getRepository(CampaignLimitOrmEntity);

      const campaign = await campaignRepository.findOne({
        where: { id: campaignId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!campaign || campaign.deletedAt) {
        throw new NotFoundException({
          code: 'RESOURCE_NOT_FOUND',
          message: {
            ar: 'تعذر العثور على الحملة المطلوبة.',
            en: 'We could not find the requested campaign.',
          },
        });
      }

      const business = await businessRepository.findOne({
        where: { id: campaign.businessId },
      });

      const limits = await limitRepository.findOne({
        where: { campaignId: campaign.id },
      });

      if (!business || !limits) {
        throw new NotFoundException({
          code: 'RESOURCE_NOT_FOUND',
          message: {
            ar: 'تعذر العثور على بيانات الحملة المطلوبة.',
            en: 'We could not find the requested campaign data.',
          },
        });
      }

      this.ensureClaimableCampaign(campaign, business, limits);

      const existingCoupon = await this.couponRepository.findByCampaignAndUser(
        campaign.id,
        actor.id,
        manager,
      );

      if (existingCoupon) {
        const coupon = await this.couponRepository.findDetailsForUser(
          existingCoupon.id,
          actor.id,
        );

        if (!coupon) {
          throw new NotFoundException({
            code: 'RESOURCE_NOT_FOUND',
            message: {
              ar: 'تعذر العثور على القسيمة الحالية.',
              en: 'We could not find the existing coupon.',
            },
          });
        }

        return {
          statusCode: 200 as const,
          couponId: coupon.id,
        };
      }

      const issuedCount = await this.couponRepository.countIssuedByCampaign(
        campaign.id,
        manager,
      );

      if (issuedCount >= limits.totalClaimLimit) {
        throw new ConflictException({
          code: 'CAMPAIGN_QUOTA_EXHAUSTED',
          message: {
            ar: 'نفدت القسائم المتاحة لهذه الحملة.',
            en: 'No more coupons are available for this campaign.',
          },
        });
      }

      const issuedAt = new Date();
      const expiresAt = this.couponExpiryCalculator.calculate({
        issuedAt,
        campaignEndAt: campaign.endAt,
        couponValidityType: limits.couponValidityType,
        couponValidityMinutes: limits.couponValidityMinutes,
        couponAbsoluteExpiresAt: limits.couponAbsoluteExpiresAt,
      });

      const couponId = await this.createCouponWithRetry(
        {
          campaignId: campaign.id,
          userId: actor.id,
          sourceId: resolvedSource.sourceId,
          issuedAt,
          expiresAt,
        },
        manager,
      );

      return {
        statusCode: 201 as const,
        couponId,
      };
    });

    const coupon = await this.couponRepository.findDetailsForUser(
      result.couponId,
      actor.id,
    );

    if (!coupon) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: {
          ar: 'تعذر العثور على القسيمة بعد إصدارها.',
          en: 'We could not find the coupon after issuing it.',
        },
      });
    }

    return {
      statusCode: result.statusCode,
      coupon,
    };
  }

  async list(
    actor: AuthenticatedPrincipal,
    query: ListMyCouponsQueryDto,
  ): Promise<CouponPageResponseDto> {
    this.ensureCustomerActor(actor);
    await this.ensureActiveUser(actor.id);

    const result = await this.couponRepository.listForUser(actor.id, query);

    return {
      items: result.items,
      meta: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        pageCount: Math.max(1, Math.ceil(result.total / query.limit)),
      },
    };
  }

  async getById(
    couponId: string,
    actor: AuthenticatedPrincipal,
  ): Promise<CouponDetailsResponseDto> {
    this.ensureCustomerActor(actor);
    await this.ensureActiveUser(actor.id);

    const coupon = await this.couponRepository.findDetailsForUser(couponId, actor.id);

    if (coupon) {
      return coupon;
    }

    const exists = await this.couponRepository.existsById(couponId);

    if (exists) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: {
          ar: 'لا يمكنك الوصول إلى هذه القسيمة.',
          en: 'You do not have permission to access this coupon.',
        },
      });
    }

    throw new NotFoundException({
      code: 'RESOURCE_NOT_FOUND',
      message: {
        ar: 'تعذر العثور على القسيمة المطلوبة.',
        en: 'We could not find the requested coupon.',
      },
    });
  }

  private async ensureActiveUser(userId: string): Promise<void> {
    const identity = await this.identityReader.findById(userId);

    if (!identity || !this.userStatusReader.isActiveForAuthentication(identity.status)) {
      throw new ForbiddenException({
        code: 'ACCOUNT_NOT_ACTIVE',
        message: {
          ar: 'هذا الحساب غير متاح حاليًا لطلب القسائم.',
          en: 'This account cannot claim coupons right now.',
        },
      });
    }
  }

  private ensureCustomerActor(actor: AuthenticatedPrincipal): void {
    if (actor.platformRole !== 'USER') {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: {
          ar: 'هذا الإجراء متاح للعملاء فقط.',
          en: 'Only customers can perform this action.',
        },
      });
    }
  }

  private ensureClaimableCampaign(
    campaign: CampaignOrmEntity,
    business: BusinessOrmEntity,
    limits: CampaignLimitOrmEntity,
  ): void {
    if (business.status !== 'ACTIVE') {
      throw new ConflictException({
        code: 'CAMPAIGN_NOT_ACTIVE',
        message: {
          ar: 'هذا العرض غير متاح حاليًا.',
          en: 'This offer is not available right now.',
        },
      });
    }

    if (campaign.status !== 'ACTIVE') {
      throw new ConflictException({
        code: 'CAMPAIGN_NOT_ACTIVE',
        message: {
          ar: 'هذه الحملة غير نشطة حاليًا.',
          en: 'This campaign is not active right now.',
        },
      });
    }

    if (!CouponIssuePolicy.isClaimableWindow(campaign.startAt, campaign.endAt)) {
      throw new ConflictException({
        code: 'CAMPAIGN_NOT_ACTIVE',
        message: {
          ar: 'هذه الحملة غير متاحة في هذا الوقت.',
          en: 'This campaign is not available at this time.',
        },
      });
    }

    if (limits.totalClaimLimit <= 0) {
      throw new ConflictException({
        code: 'CAMPAIGN_QUOTA_EXHAUSTED',
        message: {
          ar: 'نفدت القسائم المتاحة لهذه الحملة.',
          en: 'No more coupons are available for this campaign.',
        },
      });
    }
  }

  private async createCouponWithRetry(
    input: {
      campaignId: string;
      userId: string;
      sourceId: string;
      issuedAt: Date;
      expiresAt: Date;
    },
    manager: EntityManager,
  ): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const coupon = await this.couponRepository.create(
          {
            campaignId: input.campaignId,
            userId: input.userId,
            sourceId: input.sourceId,
            code: this.couponCodeGenerator.generate(),
            qrToken: randomUUID(),
            issuedAt: input.issuedAt,
            expiresAt: input.expiresAt,
            status: 'AVAILABLE',
          },
          manager,
        );

        return coupon.id;
      } catch (error) {
        if (!this.isUniqueViolation(error)) {
          throw error;
        }

        const constraint = this.extractConstraintName(error);

        if (constraint === 'coupons_campaign_user_uq') {
          const existingCoupon = await this.couponRepository.findByCampaignAndUser(
            input.campaignId,
            input.userId,
            manager,
          );

          if (existingCoupon) {
            return existingCoupon.id;
          }
        }

        if (
          constraint !== 'coupons_code_uq' &&
          constraint !== 'coupons_qr_token_uq'
        ) {
          throw error;
        }
      }
    }

    throw new ConflictException({
      code: 'REQUEST_FAILED',
      message: {
        ar: 'تعذر إصدار القسيمة حاليًا. يرجى المحاولة مرة أخرى.',
        en: 'The coupon could not be issued right now. Please try again.',
      },
    });
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
    );
  }

  private extractConstraintName(error: unknown): string | null {
    if (
      typeof error === 'object' &&
      error !== null &&
      'constraint' in error &&
      typeof (error as { constraint?: unknown }).constraint === 'string'
    ) {
      return (error as { constraint: string }).constraint;
    }

    return null;
  }
}

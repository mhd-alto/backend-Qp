import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan } from 'typeorm';
import * as crypto from 'crypto';
import { FRIENDLY_MESSAGES } from '../../../../common/constants/localized-messages';
import { AuthenticatedPrincipal } from '../../../../common/types/authenticated-principal';
import { CouponValidationAttemptOrmEntity } from '../../infrastructure/persistence/typeorm/entities/coupon-validation-attempt.orm-entity';
import { RedemptionOrmEntity } from '../../infrastructure/persistence/typeorm/entities/redemption.orm-entity';
import { CouponOrmEntity } from '../../../coupons/infrastructure/persistence/typeorm/entities/coupon.orm-entity';
import { CampaignOrmEntity } from '../../../campaigns/infrastructure/persistence/typeorm/entities/campaign.orm-entity';
import { CampaignBenefitOrmEntity } from '../../../campaigns/infrastructure/persistence/typeorm/entities/campaign-benefit.orm-entity';
import { CampaignBranchOrmEntity } from '../../../campaigns/infrastructure/persistence/typeorm/entities/campaign-branch.orm-entity';
import { BusinessMembershipOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/business-membership.orm-entity';
import { MembershipBranchOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/membership-branch.orm-entity';
import { BusinessOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/business.orm-entity';
import { BranchOrmEntity } from '../../../organizations/infrastructure/persistence/typeorm/entities/branch.orm-entity';
import { ValidateCouponRequestDto } from '../../api/dto/validate-coupon.request';
import { ValidationResultResponseDto } from '../../api/dto/validation-result.response';
import { normalizeCouponCode } from '../../../../common/utilities/normalize-coupon-code';

@Injectable()
export class ValidateCouponService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(CouponValidationAttemptOrmEntity)
    private readonly attemptRepository: Repository<CouponValidationAttemptOrmEntity>,
    @InjectRepository(CouponOrmEntity)
    private readonly couponRepository: Repository<CouponOrmEntity>,
    @InjectRepository(CampaignOrmEntity)
    private readonly campaignRepository: Repository<CampaignOrmEntity>,
    @InjectRepository(CampaignBenefitOrmEntity)
    private readonly benefitRepository: Repository<CampaignBenefitOrmEntity>,
    @InjectRepository(CampaignBranchOrmEntity)
    private readonly campaignBranchRepository: Repository<CampaignBranchOrmEntity>,
    @InjectRepository(BusinessOrmEntity)
    private readonly businessRepository: Repository<BusinessOrmEntity>,
  ) {}

  async execute(
    body: ValidateCouponRequestDto,
    actor: AuthenticatedPrincipal,
  ): Promise<ValidationResultResponseDto> {
    const now = new Date();

    return await this.dataSource.transaction(async (manager) => {
      // 1. Retrieve active staff membership and primary-branch association
      const membership = await manager.findOne(BusinessMembershipOrmEntity, {
        where: { userId: actor.id, status: 'ACTIVE', role: 'STAFF' },
      });

      if (!membership) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: FRIENDLY_MESSAGES.FORBIDDEN,
        });
      }

      // Check rate limit (max 30 attempts per minute per staff member)
      const ONE_MINUTE_AGO = new Date(now.getTime() - 60000);
      const recentAttemptsCount = await manager.count(CouponValidationAttemptOrmEntity, {
        where: {
          staffMembershipId: membership.id,
          attemptedAt: MoreThan(ONE_MINUTE_AGO),
        },
      });

      if (recentAttemptsCount >= 30) {
        throw new HttpException(
          {
            code: 'TOO_MANY_ATTEMPTS',
            message: {
              ar: 'لقد تجاوزت الحد المسموح به من محاولات التحقق. يرجى المحاولة لاحقاً.',
              en: 'Too many validation attempts. Please try again later.',
            },
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      const mb = await manager.findOne(MembershipBranchOrmEntity, {
        where: { membershipId: membership.id },
      });

      if (!mb) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: FRIENDLY_MESSAGES.FORBIDDEN,
        });
      }

      const staffBranchId = mb.branchId;
      const staffBusinessId = mb.businessId;

      // Verify active branch status
      const branch = await manager.findOne(BranchOrmEntity, {
        where: { id: staffBranchId },
      });

      if (!branch || branch.status !== 'ACTIVE' || branch.deletedAt) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: FRIENDLY_MESSAGES.FORBIDDEN,
        });
      }

      // 2. Find coupon and calculate fingerprint
      let coupon: CouponOrmEntity | null = null;
      let inputFingerprint: string | null = null;

      if (body.qrToken) {
        inputFingerprint = crypto.createHash('sha256').update(body.qrToken).digest('hex');
        coupon = await manager.findOne(CouponOrmEntity, {
          where: { qrToken: body.qrToken },
        });
      } else if (body.code) {
        const normalized = normalizeCouponCode(body.code);
        inputFingerprint = crypto.createHash('sha256').update(normalized).digest('hex');
        coupon = await manager.findOne(CouponOrmEntity, {
          where: { code: normalized },
        });
      }

      // If not found
      if (!coupon) {
        await this.logAttempt(
          manager,
          staffBusinessId,
          staffBranchId,
          membership.id,
          null,
          inputFingerprint,
          'NOT_FOUND',
        );
        return {
          result: 'INVALID',
          failureReason: 'NOT_FOUND',
          coupon: null,
          benefit: null,
          previouslyRedeemedAt: null,
        };
      }

      // 3. Find campaign
      const campaign = await manager.findOne(CampaignOrmEntity, {
        where: { id: coupon.campaignId },
      });

      if (!campaign || campaign.deletedAt) {
        await this.logAttempt(
          manager,
          staffBusinessId,
          staffBranchId,
          membership.id,
          coupon.id,
          inputFingerprint,
          'NOT_FOUND',
        );
        return {
          result: 'INVALID',
          failureReason: 'NOT_FOUND',
          coupon: null,
          benefit: null,
          previouslyRedeemedAt: null,
        };
      }

      const business = await manager.findOneOrFail(BusinessOrmEntity, {
        where: { id: campaign.businessId },
      });

      // 4. Validate business ownership
      if (campaign.businessId !== staffBusinessId) {
        await this.logAttempt(
          manager,
          staffBusinessId,
          staffBranchId,
          membership.id,
          coupon.id,
          inputFingerprint,
          'WRONG_BUSINESS',
        );
        return {
          result: 'INVALID',
          failureReason: 'WRONG_BUSINESS',
          coupon: null,
          benefit: null,
          previouslyRedeemedAt: null,
        };
      }

      // 5. Validate coupon status
      if (coupon.status === 'REDEEMED') {
        const redemption = await manager.findOne(RedemptionOrmEntity, {
          where: { couponId: coupon.id },
        });
        await this.logAttempt(
          manager,
          staffBusinessId,
          staffBranchId,
          membership.id,
          coupon.id,
          inputFingerprint,
          'ALREADY_REDEEMED',
        );
        return {
          result: 'INVALID',
          failureReason: 'ALREADY_REDEEMED',
          coupon: null,
          benefit: null,
          previouslyRedeemedAt: redemption?.redeemedAt.toISOString() ?? null,
        };
      }

      if (coupon.status === 'CANCELLED') {
        await this.logAttempt(
          manager,
          staffBusinessId,
          staffBranchId,
          membership.id,
          coupon.id,
          inputFingerprint,
          'CANCELLED',
        );
        return {
          result: 'INVALID',
          failureReason: 'CANCELLED',
          coupon: null,
          benefit: null,
          previouslyRedeemedAt: null,
        };
      }

      if (coupon.status === 'SUSPENDED') {
        await this.logAttempt(
          manager,
          staffBusinessId,
          staffBranchId,
          membership.id,
          coupon.id,
          inputFingerprint,
          'SUSPENDED',
        );
        return {
          result: 'INVALID',
          failureReason: 'SUSPENDED',
          coupon: null,
          benefit: null,
          previouslyRedeemedAt: null,
        };
      }

      // 6. Validate expiry
      if (coupon.expiresAt < now) {
        await this.logAttempt(
          manager,
          staffBusinessId,
          staffBranchId,
          membership.id,
          coupon.id,
          inputFingerprint,
          'EXPIRED',
        );
        return {
          result: 'INVALID',
          failureReason: 'EXPIRED',
          coupon: null,
          benefit: null,
          previouslyRedeemedAt: null,
        };
      }

      // 7. Validate campaign status and time window
      if (campaign.status === 'SUSPENDED') {
        await this.logAttempt(
          manager,
          staffBusinessId,
          staffBranchId,
          membership.id,
          coupon.id,
          inputFingerprint,
          'SUSPENDED',
        );
        return {
          result: 'INVALID',
          failureReason: 'SUSPENDED',
          coupon: null,
          benefit: null,
          previouslyRedeemedAt: null,
        };
      }

      if (campaign.status !== 'ACTIVE' || campaign.startAt > now || campaign.endAt < now) {
        await this.logAttempt(
          manager,
          staffBusinessId,
          staffBranchId,
          membership.id,
          coupon.id,
          inputFingerprint,
          'CAMPAIGN_INACTIVE',
        );
        return {
          result: 'INVALID',
          failureReason: 'CAMPAIGN_INACTIVE',
          coupon: null,
          benefit: null,
          previouslyRedeemedAt: null,
        };
      }

      // 8. Validate branch link
      const campaignBranch = await manager.findOne(CampaignBranchOrmEntity, {
        where: { campaignId: campaign.id, branchId: staffBranchId },
      });

      if (!campaignBranch) {
        await this.logAttempt(
          manager,
          staffBusinessId,
          staffBranchId,
          membership.id,
          coupon.id,
          inputFingerprint,
          'BRANCH_NOT_ALLOWED',
        );
        return {
          result: 'INVALID',
          failureReason: 'BRANCH_NOT_ALLOWED',
          coupon: null,
          benefit: null,
          previouslyRedeemedAt: null,
        };
      }

      // 9. Check business status
      if (business.status !== 'ACTIVE') {
        await this.logAttempt(
          manager,
          staffBusinessId,
          staffBranchId,
          membership.id,
          coupon.id,
          inputFingerprint,
          'SUSPENDED',
        );
        return {
          result: 'INVALID',
          failureReason: 'SUSPENDED',
          coupon: null,
          benefit: null,
          previouslyRedeemedAt: null,
        };
      }

      // 10. Valid!
      const benefit = await manager.findOneOrFail(CampaignBenefitOrmEntity, {
        where: { campaignId: campaign.id },
      });

      await this.logAttempt(
        manager,
        staffBusinessId,
        staffBranchId,
        membership.id,
        coupon.id,
        inputFingerprint,
        null,
        'VALID',
      );

      return {
        result: 'VALID',
        failureReason: null,
        coupon: {
          id: coupon.id,
          campaignId: coupon.campaignId,
          code: coupon.code,
          status: coupon.status,
          effectiveStatus: 'AVAILABLE',
          issuedAt: coupon.issuedAt.toISOString(),
          expiresAt: coupon.expiresAt.toISOString(),
          offerTitle: campaign.title,
          businessName: business.displayName,
        },
        benefit: {
          benefitType: benefit.benefitType,
          percentageValue: benefit.percentageValue ? Number(benefit.percentageValue) : null,
          fixedAmount: benefit.fixedAmount ? Number(benefit.fixedAmount) : null,
          currency: benefit.currency,
          maxDiscountAmount: benefit.maxDiscountAmount ? Number(benefit.maxDiscountAmount) : null,
          description: benefit.description,
          descriptionEn: benefit.descriptionEn,
        },
        previouslyRedeemedAt: null,
      };
    });
  }

  private async logAttempt(
    manager: any,
    businessId: string,
    branchId: string,
    staffMembershipId: string,
    couponId: string | null,
    inputFingerprint: string | null,
    failureReason: string | null,
    result: 'VALID' | 'INVALID' = 'INVALID',
  ): Promise<void> {
    const attempt = manager.create(CouponValidationAttemptOrmEntity, {
      businessId,
      branchId,
      staffMembershipId,
      couponId,
      inputFingerprint,
      result,
      failureReason,
    });
    await manager.save(CouponValidationAttemptOrmEntity, attempt);
  }
}

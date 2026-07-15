import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { FRIENDLY_MESSAGES } from '../../../common/constants/localized-messages';
import { AuthenticatedPrincipal } from '../../../common/types/authenticated-principal';
import { AUDIT_WRITER } from '../../audit/contracts/audit.tokens';
import { AuditWriter } from '../../audit/contracts/audit-writer';
import { CATEGORY_READER, CategoryReader } from '../../reference-data/contracts/category-reader';
import { BranchOrmEntity } from '../../organizations/infrastructure/persistence/typeorm/entities/branch.orm-entity';
import { CreateCampaignRequestDto, UpdateCampaignRequestDto } from '../api/dto/campaign.request';
import { ListCampaignsQueryDto } from '../api/dto/campaign.query';
import { CampaignAccessService } from './shared/campaign-access.service';
import { CampaignReadRepository } from '../infrastructure/persistence/typeorm/queries/campaign-read.repository';
import { CampaignBenefitOrmEntity } from '../infrastructure/persistence/typeorm/entities/campaign-benefit.orm-entity';
import { CampaignBranchOrmEntity } from '../infrastructure/persistence/typeorm/entities/campaign-branch.orm-entity';
import { CampaignLimitOrmEntity } from '../infrastructure/persistence/typeorm/entities/campaign-limit.orm-entity';
import { CampaignOrmEntity } from '../infrastructure/persistence/typeorm/entities/campaign.orm-entity';

@Injectable()
export class BusinessCampaignsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(CampaignOrmEntity)
    private readonly campaignRepository: Repository<CampaignOrmEntity>,
    @InjectRepository(CampaignBenefitOrmEntity)
    private readonly benefitRepository: Repository<CampaignBenefitOrmEntity>,
    @InjectRepository(CampaignLimitOrmEntity)
    private readonly limitRepository: Repository<CampaignLimitOrmEntity>,
    @InjectRepository(CampaignBranchOrmEntity)
    private readonly branchLinkRepository: Repository<CampaignBranchOrmEntity>,
    @InjectRepository(BranchOrmEntity)
    private readonly branchRepository: Repository<BranchOrmEntity>,
    @Inject(CATEGORY_READER)
    private readonly categoryReader: CategoryReader,
    @Inject(AUDIT_WRITER)
    private readonly auditWriter: AuditWriter,
    private readonly accessService: CampaignAccessService,
    private readonly readRepository: CampaignReadRepository,
  ) {}

  async list(actor: AuthenticatedPrincipal, query: ListCampaignsQueryDto) {
    const context = await this.accessService.requireActiveOwner(actor);
    const result = await this.readRepository.listBusinessCampaigns(
      context.business.id,
      query.status,
      query.page,
      query.limit,
    );

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

  async create(body: CreateCampaignRequestDto, actor: AuthenticatedPrincipal) {
    const context = await this.accessService.requireActiveOwner(actor);
    await this.validateCategory(body.primaryCategoryId);
    await this.validateBranch(body.branchId, context.business.id);
    this.validateDates(body.startAt, body.endAt);
    this.validateBenefit(body.benefit);

    const existing = await this.campaignRepository.findOne({
      where: { publicSlug: body.publicSlug },
    });

    if (existing && !existing.deletedAt) {
      throw new ConflictException({
        code: 'IDENTIFIER_ALREADY_IN_USE',
        message: {
          ar: 'رابط الحملة مستخدم بالفعل.',
          en: 'This campaign slug is already in use.',
        },
      });
    }

    const campaignId = await this.dataSource.transaction(async (manager) => {
      const campaignRepository = manager.getRepository(CampaignOrmEntity);
      const benefitRepository = manager.getRepository(CampaignBenefitOrmEntity);
      const limitRepository = manager.getRepository(CampaignLimitOrmEntity);
      const branchLinkRepository = manager.getRepository(CampaignBranchOrmEntity);

      const campaign = await campaignRepository.save(
        campaignRepository.create({
          businessId: context.business.id,
          primaryCategoryId: body.primaryCategoryId,
          createdByMembershipId: context.membership.id,
          title: body.title.trim(),
          titleEn: body.titleEn?.trim() ?? null,
          publicSlug: body.publicSlug,
          description: body.description.trim(),
          descriptionEn: body.descriptionEn?.trim() ?? null,
          imageUrl: body.imageUrl?.trim() ?? null,
          termsText: body.termsText.trim(),
          termsTextEn: body.termsTextEn?.trim() ?? null,
          status: 'DRAFT',
          startAt: new Date(body.startAt),
          endAt: new Date(body.endAt),
          isSearchable: body.isSearchable ?? true,
        }),
      );

      await benefitRepository.save(
        benefitRepository.create({
          campaignId: campaign.id,
          benefitType: body.benefit.type,
          percentageValue:
            body.benefit.type === 'PERCENTAGE'
              ? body.benefit.percentageValue?.toFixed(2)
              : null,
          fixedAmount:
            body.benefit.type === 'FIXED_AMOUNT'
              ? body.benefit.fixedAmount?.toFixed(2)
              : null,
          maxDiscountAmount: body.benefit.maxDiscountAmount
            ? body.benefit.maxDiscountAmount.toFixed(2)
            : null,
          currency:
            body.benefit.type === 'FIXED_AMOUNT'
              ? body.benefit.currency?.trim().toUpperCase() ?? 'SYP'
              : body.benefit.currency?.trim().toUpperCase() ?? 'SYP',
          description: body.benefit.description?.trim() ?? null,
          descriptionEn: body.benefit.descriptionEn?.trim() ?? null,
        }),
      );

      await limitRepository.save(
        limitRepository.create({
          campaignId: campaign.id,
          totalClaimLimit: body.totalClaimLimit,
          perUserClaimLimit: 1,
          maxRedemptionsPerCoupon: 1,
          couponValidityType: 'CAMPAIGN_END',
        }),
      );

      await branchLinkRepository.save(
        branchLinkRepository.create({
          campaignId: campaign.id,
          branchId: body.branchId,
          businessId: context.business.id,
        }),
      );

      return campaign.id;
    });

    await this.auditWriter.write({
      actorUserId: actor.id,
      businessId: context.business.id,
      action: 'CAMPAIGN_CREATED',
      entityType: 'CAMPAIGN',
      entityId: campaignId,
      metadata: {
        publicSlug: body.publicSlug,
      },
    });

    return this.readRepository.getCampaignDetails(campaignId);
  }

  async getById(campaignId: string, actor: AuthenticatedPrincipal) {
    await this.accessService.requireOwnedCampaign(actor, campaignId);
    return this.readRepository.getCampaignDetails(campaignId);
  }

  async update(
    campaignId: string,
    body: UpdateCampaignRequestDto,
    actor: AuthenticatedPrincipal,
  ) {
    const context = await this.accessService.requireOwnedCampaign(actor, campaignId);

    if (!['DRAFT', 'REJECTED'].includes(context.campaign.status)) {
      throw new ConflictException({
        code: 'CAMPAIGN_NOT_EDITABLE',
        message: {
          ar: 'لا يمكن تعديل هذه الحملة في حالتها الحالية.',
          en: 'This campaign cannot be edited in its current state.',
        },
      });
    }

    if (body.primaryCategoryId) {
      await this.validateCategory(body.primaryCategoryId);
    }

    if (body.branchId) {
      await this.validateBranch(body.branchId, context.business.id);
    }

    const startAt = body.startAt ?? context.campaign.startAt.toISOString();
    const endAt = body.endAt ?? context.campaign.endAt.toISOString();
    this.validateDates(startAt, endAt);

    if (body.benefit) {
      this.validateBenefit(body.benefit);
    }

    if (body.publicSlug && body.publicSlug !== context.campaign.publicSlug) {
      const existing = await this.campaignRepository.findOne({
        where: { publicSlug: body.publicSlug },
      });

      if (existing && existing.id !== campaignId && !existing.deletedAt) {
        throw new ConflictException({
          code: 'IDENTIFIER_ALREADY_IN_USE',
          message: {
            ar: 'رابط الحملة مستخدم بالفعل.',
            en: 'This campaign slug is already in use.',
          },
        });
      }
    }

    await this.dataSource.transaction(async (manager) => {
      const campaignRepository = manager.getRepository(CampaignOrmEntity);
      const benefitRepository = manager.getRepository(CampaignBenefitOrmEntity);
      const limitRepository = manager.getRepository(CampaignLimitOrmEntity);
      const branchLinkRepository = manager.getRepository(CampaignBranchOrmEntity);

      await campaignRepository.update(
        { id: campaignId },
        {
          title: body.title?.trim(),
          titleEn: body.titleEn === undefined ? undefined : body.titleEn?.trim() ?? null,
          publicSlug: body.publicSlug,
          description: body.description?.trim(),
          descriptionEn:
            body.descriptionEn === undefined ? undefined : body.descriptionEn?.trim() ?? null,
          imageUrl: body.imageUrl === undefined ? undefined : body.imageUrl?.trim() ?? null,
          termsText: body.termsText?.trim(),
          termsTextEn:
            body.termsTextEn === undefined ? undefined : body.termsTextEn?.trim() ?? null,
          primaryCategoryId: body.primaryCategoryId,
          startAt: body.startAt ? new Date(body.startAt) : undefined,
          endAt: body.endAt ? new Date(body.endAt) : undefined,
          isSearchable: body.isSearchable,
        },
      );

      if (body.benefit) {
        await benefitRepository.update(
          { campaignId },
          {
            benefitType: body.benefit.type,
            percentageValue:
              body.benefit.type === 'PERCENTAGE'
                ? body.benefit.percentageValue?.toFixed(2)
                : null,
            fixedAmount:
              body.benefit.type === 'FIXED_AMOUNT'
                ? body.benefit.fixedAmount?.toFixed(2)
                : null,
            maxDiscountAmount: body.benefit.maxDiscountAmount
              ? body.benefit.maxDiscountAmount.toFixed(2)
              : null,
            currency:
              body.benefit.type === 'FIXED_AMOUNT'
                ? body.benefit.currency?.trim().toUpperCase() ?? 'SYP'
                : body.benefit.currency?.trim().toUpperCase() ?? 'SYP',
            description:
              body.benefit.description === undefined
                ? undefined
                : body.benefit.description?.trim() ?? null,
            descriptionEn:
              body.benefit.descriptionEn === undefined
                ? undefined
                : body.benefit.descriptionEn?.trim() ?? null,
          },
        );
      }

      if (body.totalClaimLimit !== undefined) {
        await limitRepository.update(
          { campaignId },
          {
            totalClaimLimit: body.totalClaimLimit,
          },
        );
      }

      if (body.branchId) {
        await branchLinkRepository.delete({ campaignId });
        await branchLinkRepository.save(
          branchLinkRepository.create({
            campaignId,
            branchId: body.branchId,
            businessId: context.business.id,
          }),
        );
      }
    });

    await this.auditWriter.write({
      actorUserId: actor.id,
      businessId: context.business.id,
      action: 'CAMPAIGN_UPDATED',
      entityType: 'CAMPAIGN',
      entityId: campaignId,
    });

    return this.readRepository.getCampaignDetails(campaignId);
  }

  async submit(campaignId: string, actor: AuthenticatedPrincipal) {
    const context = await this.accessService.requireOwnedCampaign(actor, campaignId);

    if (!['DRAFT', 'REJECTED'].includes(context.campaign.status)) {
      throw new ConflictException({
        code: 'CAMPAIGN_NOT_EDITABLE',
        message: {
          ar: 'لا يمكن إرسال هذه الحملة للمراجعة في حالتها الحالية.',
          en: 'This campaign cannot be submitted in its current state.',
        },
      });
    }

    await this.ensureCampaignComplete(campaignId);

    await this.campaignRepository.update(
      { id: campaignId },
      {
        status: 'PENDING_REVIEW',
        submittedByMembershipId: context.membership.id,
        submittedAt: new Date(),
      },
    );

    await this.auditWriter.write({
      actorUserId: actor.id,
      businessId: context.business.id,
      action: 'CAMPAIGN_SUBMITTED',
      entityType: 'CAMPAIGN',
      entityId: campaignId,
    });

    return this.readRepository.getCampaignDetails(campaignId);
  }

  async withdraw(campaignId: string, actor: AuthenticatedPrincipal) {
    const context = await this.accessService.requireOwnedCampaign(actor, campaignId);

    if (context.campaign.status !== 'PENDING_REVIEW') {
      throw new ConflictException({
        code: 'CAMPAIGN_NOT_EDITABLE',
        message: {
          ar: 'لا يمكن سحب هذه الحملة في حالتها الحالية.',
          en: 'This campaign cannot be withdrawn in its current state.',
        },
      });
    }

    await this.campaignRepository.update(
      { id: campaignId },
      {
        status: 'DRAFT',
      },
    );

    await this.auditWriter.write({
      actorUserId: actor.id,
      businessId: context.business.id,
      action: 'CAMPAIGN_WITHDRAWN',
      entityType: 'CAMPAIGN',
      entityId: campaignId,
    });

    return this.readRepository.getCampaignDetails(campaignId);
  }

  private async ensureCampaignComplete(campaignId: string): Promise<void> {
    const details = await this.readRepository.getCampaignDetails(campaignId);

    if (
      !details ||
      !details.title ||
      !details.description ||
      !details.termsText ||
      !details.category?.id ||
      !details.primaryBranch?.id ||
      !details.benefit?.type ||
      details.totalClaimLimit <= 0
    ) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: {
          ar: 'الحملة غير مكتملة ولا يمكن إرسالها للمراجعة.',
          en: 'The campaign is incomplete and cannot be submitted for review.',
        },
      });
    }
  }

  private async validateCategory(categoryId: string): Promise<void> {
    const category = await this.categoryReader.findById(categoryId);

    if (!category || category.status !== 'ACTIVE') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: {
          ar: 'الفئة المحددة غير صالحة.',
          en: 'The selected category is not valid.',
        },
      });
    }
  }

  private async validateBranch(branchId: string, businessId: string): Promise<void> {
    const branch = await this.branchRepository.findOne({
      where: { id: branchId, businessId },
    });

    if (!branch || branch.status !== 'ACTIVE' || branch.deletedAt) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: {
          ar: 'الفرع المحدد غير صالح لهذه الحملة.',
          en: 'The selected branch is not valid for this campaign.',
        },
      });
    }
  }

  private validateDates(startAt: string, endAt: string): void {
    if (Number.isNaN(Date.parse(startAt)) || Number.isNaN(Date.parse(endAt))) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: FRIENDLY_MESSAGES.VALIDATION_ERROR,
      });
    }

    if (new Date(endAt) <= new Date(startAt)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: {
          ar: 'يجب أن يكون تاريخ الانتهاء بعد تاريخ البدء.',
          en: 'End date must be after the start date.',
        },
      });
    }
  }

  private validateBenefit(body: CreateCampaignRequestDto['benefit']): void {
    if (
      body.type === 'PERCENTAGE' &&
      (body.percentageValue === undefined ||
        body.percentageValue === null ||
        body.percentageValue <= 0 ||
        body.percentageValue > 100)
    ) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: {
          ar: 'قيمة الخصم بالنسبة المئوية غير صالحة.',
          en: 'The percentage discount value is not valid.',
        },
      });
    }

    if (
      body.type === 'FIXED_AMOUNT' &&
      (body.fixedAmount === undefined ||
        body.fixedAmount === null ||
        body.fixedAmount <= 0 ||
        !body.currency)
    ) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: {
          ar: 'قيمة الخصم الثابت غير صالحة.',
          en: 'The fixed discount amount is not valid.',
        },
      });
    }
  }
}

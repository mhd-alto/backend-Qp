import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryOrmEntity } from '../../../../../reference-data/infrastructure/persistence/typeorm/entities/category.orm-entity';
import { BranchOrmEntity } from '../../../../../organizations/infrastructure/persistence/typeorm/entities/branch.orm-entity';
import { CampaignBenefitOrmEntity } from '../entities/campaign-benefit.orm-entity';
import { CampaignBranchOrmEntity } from '../entities/campaign-branch.orm-entity';
import { CampaignLimitOrmEntity } from '../entities/campaign-limit.orm-entity';
import { CampaignOrmEntity } from '../entities/campaign.orm-entity';
import { CampaignSourceOrmEntity } from '../entities/campaign-source.orm-entity';
import { BusinessOrmEntity } from '../../../../../organizations/infrastructure/persistence/typeorm/entities/business.orm-entity';

type CampaignBenefitModel = {
  type: string;
  percentageValue: number | null;
  fixedAmount: number | null;
  currency: string | null;
  maxDiscountAmount: number | null;
  description: string | null;
  descriptionEn: string | null;
};

type CampaignSummaryModel = {
  id: string;
  title: string;
  titleEn: string | null;
  publicSlug: string;
  status: string;
  startAt: string;
  endAt: string;
  benefit: CampaignBenefitModel;
  totalClaimLimit: number;
  rejectionReason: string | null;
  suspensionReason: string | null;
  business?: {
    id: string;
    displayName: string;
    displayNameEn: string | null;
    slug: string;
    logoUrl: string | null;
    phone: string;
    status: string;
  } | null;
};

type CampaignDetailsModel = CampaignSummaryModel & {
  description: string;
  descriptionEn: string | null;
  termsText: string;
  termsTextEn: string | null;
  imageUrl: string | null;
  category: {
    id: string;
    nameAr: string;
    nameEn: string | null;
    slug: string;
    status: string;
  };
  primaryBranch: {
    id: string;
    name: string;
    nameEn: string | null;
    addressLine: string;
    addressLineEn: string | null;
    phone: string | null;
  };
  submittedAt: string | null;
  reviewedAt: string | null;
  publishedAt: string | null;
  sources: Array<{
    id: string;
    sourceType: string;
    label: string;
    labelEn: string | null;
    trackingToken: string;
    status: string;
    isSystemGenerated: boolean;
    trackingUrl: string;
  }>;
};

@Injectable()
export class CampaignReadRepository {
  constructor(
    @InjectRepository(CampaignOrmEntity)
    private readonly campaignRepository: Repository<CampaignOrmEntity>,
    @InjectRepository(CampaignBenefitOrmEntity)
    private readonly benefitRepository: Repository<CampaignBenefitOrmEntity>,
    @InjectRepository(CampaignLimitOrmEntity)
    private readonly limitRepository: Repository<CampaignLimitOrmEntity>,
    @InjectRepository(CampaignBranchOrmEntity)
    private readonly campaignBranchRepository: Repository<CampaignBranchOrmEntity>,
    @InjectRepository(CampaignSourceOrmEntity)
    private readonly sourceRepository: Repository<CampaignSourceOrmEntity>,
    @InjectRepository(CategoryOrmEntity)
    private readonly categoryRepository: Repository<CategoryOrmEntity>,
    @InjectRepository(BranchOrmEntity)
    private readonly branchRepository: Repository<BranchOrmEntity>,
  ) {}

  async listBusinessCampaigns(
    businessId: string,
    status: string | undefined,
    page: number,
    limit: number,
  ): Promise<{ items: CampaignSummaryModel[]; total: number }> {
    const query = this.campaignRepository
      .createQueryBuilder('campaign')
      .where('campaign.business_id = :businessId', { businessId })
      .andWhere('campaign.deleted_at IS NULL')
      .orderBy('campaign.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      query.andWhere('campaign.status = :status', { status });
    }

    const [campaigns, total] = await query.getManyAndCount();
    const items = await Promise.all(campaigns.map((campaign) => this.toSummary(campaign)));

    return { items, total };
  }

  async listAdminCampaigns(
    status: string | undefined,
    page: number,
    limit: number,
  ): Promise<{ items: CampaignSummaryModel[]; total: number }> {
    const query = this.campaignRepository
      .createQueryBuilder('campaign')
      .where('campaign.deleted_at IS NULL')
      .orderBy('campaign.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      query.andWhere('campaign.status = :status', { status });
    }

    const [campaigns, total] = await query.getManyAndCount();
    const items = await Promise.all(campaigns.map((campaign) => this.toSummary(campaign)));

    return { items, total };
  }

  async getCampaignDetails(campaignId: string): Promise<CampaignDetailsModel | null> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
    });

    if (!campaign || campaign.deletedAt) {
      return null;
    }

    const summary = await this.toSummary(campaign);
    const category = await this.categoryRepository.findOne({
      where: { id: campaign.primaryCategoryId },
    });
    const campaignBranch = await this.campaignBranchRepository.findOne({
      where: { campaignId: campaign.id, businessId: campaign.businessId },
      order: { createdAt: 'ASC' },
    });

    const branch = campaignBranch
      ? await this.branchRepository.findOne({
          where: { id: campaignBranch.branchId, businessId: campaign.businessId },
        })
      : null;

    const sources = await this.sourceRepository.find({
      where: { campaignId: campaign.id },
      order: { createdAt: 'ASC' },
    });

    if (!category || !branch) {
      return null;
    }

    return {
      ...summary,
      description: campaign.description,
      descriptionEn: campaign.descriptionEn,
      termsText: campaign.termsText,
      termsTextEn: campaign.termsTextEn,
      imageUrl: campaign.imageUrl,
      category: {
        id: category.id,
        nameAr: category.nameAr,
        nameEn: category.nameEn,
        slug: category.slug,
        status: category.status,
      },
      primaryBranch: {
        id: branch.id,
        name: branch.name,
        nameEn: branch.nameEn,
        addressLine: branch.addressLine,
        addressLineEn: branch.addressLineEn,
        phone: branch.phone,
      },
      submittedAt: campaign.submittedAt?.toISOString() ?? null,
      reviewedAt: campaign.reviewedAt?.toISOString() ?? null,
      publishedAt: campaign.publishedAt?.toISOString() ?? null,
      sources: sources.map((source) => ({
        id: source.id,
        sourceType: source.sourceType,
        label: source.label,
        labelEn: source.labelEn,
        trackingToken: source.trackingToken,
        status: source.status,
        isSystemGenerated: source.isSystemGenerated,
        trackingUrl: `/offers/${campaign.publicSlug}?src=${source.trackingToken}`,
      })),
    };
  }

  async listCampaignSources(
    campaignId: string,
  ): Promise<CampaignDetailsModel['sources']> {
    const details = await this.getCampaignDetails(campaignId);
    return details?.sources ?? [];
  }

  private async toSummary(campaign: CampaignOrmEntity): Promise<CampaignSummaryModel> {
    const benefit = await this.benefitRepository.findOne({
      where: { campaignId: campaign.id },
    });
    const limits = await this.limitRepository.findOne({
      where: { campaignId: campaign.id },
    });
    const business = await this.campaignRepository.manager.findOne(BusinessOrmEntity, {
      where: { id: campaign.businessId },
    });

    return {
      id: campaign.id,
      title: campaign.title,
      titleEn: campaign.titleEn,
      publicSlug: campaign.publicSlug,
      status: campaign.status,
      startAt: campaign.startAt.toISOString(),
      endAt: campaign.endAt.toISOString(),
      benefit: {
        type: benefit?.benefitType ?? 'PERCENTAGE',
        percentageValue: benefit?.percentageValue ? Number(benefit.percentageValue) : null,
        fixedAmount: benefit?.fixedAmount ? Number(benefit.fixedAmount) : null,
        currency: benefit?.currency ?? null,
        maxDiscountAmount: benefit?.maxDiscountAmount
          ? Number(benefit.maxDiscountAmount)
          : null,
        description: benefit?.description ?? null,
        descriptionEn: benefit?.descriptionEn ?? null,
      },
      totalClaimLimit: limits?.totalClaimLimit ?? 0,
      rejectionReason: campaign.rejectionReason,
      suspensionReason: campaign.suspensionReason,
      business: business
        ? {
            id: business.id,
            displayName: business.displayName,
            displayNameEn: business.displayNameEn,
            slug: business.slug,
            logoUrl: business.logoUrl,
            phone: business.phone,
            status: business.status,
          }
        : null,
    };
  }
}

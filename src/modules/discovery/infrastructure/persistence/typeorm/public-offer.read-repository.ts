import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CampaignPerformanceViewEntity } from '../../../../analytics/infrastructure/persistence/typeorm/view-entities/campaign-performance.view-entity';
import { CampaignBenefitOrmEntity } from '../../../../campaigns/infrastructure/persistence/typeorm/entities/campaign-benefit.orm-entity';
import { CampaignBranchOrmEntity } from '../../../../campaigns/infrastructure/persistence/typeorm/entities/campaign-branch.orm-entity';
import { CampaignLimitOrmEntity } from '../../../../campaigns/infrastructure/persistence/typeorm/entities/campaign-limit.orm-entity';
import { CampaignOrmEntity } from '../../../../campaigns/infrastructure/persistence/typeorm/entities/campaign.orm-entity';
import { CampaignSourceOrmEntity } from '../../../../campaigns/infrastructure/persistence/typeorm/entities/campaign-source.orm-entity';
import { BranchOrmEntity } from '../../../../organizations/infrastructure/persistence/typeorm/entities/branch.orm-entity';
import { BusinessOrmEntity } from '../../../../organizations/infrastructure/persistence/typeorm/entities/business.orm-entity';
import { CategoryOrmEntity } from '../../../../reference-data/infrastructure/persistence/typeorm/entities/category.orm-entity';
import {
  OfferCardResponseDto,
  OfferDetailsResponseDto,
} from '../../../api/dto/public-offer.response';
import { CategoryResponseDto } from '../../../../reference-data/api/dto/category.response';
import { CampaignVisitOrmEntity } from './entities/campaign-visit.orm-entity';
import { AttributionContext } from '../../../domain/attribution/attribution-context';
import { PublicOfferQueryBuilder } from './query-builders/public-offer-query.builder';

type ListFilters = {
  normalizedQuery?: string;
  categorySlug?: string;
  page: number;
  limit: number;
};

type PublicOfferRow = {
  campaign_id: string;
  campaign_slug: string;
  campaign_title: string;
  campaign_title_en: string | null;
  campaign_image_url: string | null;
  campaign_description: string;
  campaign_description_en: string | null;
  campaign_terms_text: string;
  campaign_terms_text_en: string | null;
  campaign_start_at: Date;
  campaign_end_at: Date;
  campaign_status: string;
  campaign_is_searchable: boolean;
  business_id: string;
  business_display_name: string;
  business_display_name_en: string | null;
  business_slug: string;
  business_logo_url: string | null;
  business_phone: string;
  business_status: string;
  branch_id: string;
  branch_name: string;
  branch_name_en: string | null;
  branch_address_line: string;
  branch_address_line_en: string | null;
  branch_phone: string | null;
  category_id: string;
  category_parent_id: string | null;
  category_name_ar: string;
  category_name_en: string | null;
  category_slug: string;
  category_icon_url: string | null;
  category_sort_order: number;
  category_status: string;
  benefit_type: string;
  benefit_percentage_value: string | null;
  benefit_fixed_amount: string | null;
  benefit_currency: string;
  benefit_max_discount_amount: string | null;
  total_claim_limit: number;
  remaining_quota: number | string | null;
};

@Injectable()
export class PublicOfferReadRepository {
  constructor(
    @InjectRepository(CampaignOrmEntity)
    private readonly campaignRepository: Repository<CampaignOrmEntity>,
    @InjectRepository(CampaignSourceOrmEntity)
    private readonly sourceRepository: Repository<CampaignSourceOrmEntity>,
    @InjectRepository(CategoryOrmEntity)
    private readonly categoryRepository: Repository<CategoryOrmEntity>,
    @InjectRepository(CampaignVisitOrmEntity)
    private readonly campaignVisitRepository: Repository<CampaignVisitOrmEntity>,
  ) {}

  async isActiveCategorySlug(slug: string): Promise<boolean> {
    const category = await this.categoryRepository.findOne({
      where: { slug, status: 'ACTIVE' },
    });

    return Boolean(category);
  }

  async listPublicOffers(
    filters: ListFilters,
  ): Promise<{ items: OfferCardResponseDto[]; total: number }> {
    const now = new Date();
    const query = PublicOfferQueryBuilder.applyListVisibility(
      this.baseOfferQuery(),
      now,
    );

    if (filters.categorySlug) {
      query.andWhere('category.slug = :categorySlug', {
        categorySlug: filters.categorySlug,
      });
    }

    if (filters.normalizedQuery) {
      const like = `%${filters.normalizedQuery}%`;
      query.andWhere(
        new Brackets((qb) => {
          qb.where('campaign.title ILIKE :like', { like })
            .orWhere('campaign.title_en ILIKE :like', { like })
            .orWhere('campaign.description ILIKE :like', { like })
            .orWhere('campaign.description_en ILIKE :like', { like })
            .orWhere('business.display_name ILIKE :like', { like })
            .orWhere('business.display_name_en ILIKE :like', { like });
        }),
      );
    }

    const countQuery = query.clone().select('campaign.id').distinct(true);
    const total = await countQuery.getCount();
    const rows = (await query
      .orderBy('campaign.created_at', 'DESC')
      .offset((filters.page - 1) * filters.limit)
      .limit(filters.limit)
      .getRawMany()) as PublicOfferRow[];

    return {
      items: rows.map((row) => this.mapOfferCard(row)),
      total,
    };
  }

  async getPublicOfferBySlug(slug: string): Promise<OfferDetailsResponseDto | null> {
    const row = (await PublicOfferQueryBuilder.applyDetailVisibility(
      this.baseOfferQuery(),
    )
      .andWhere('campaign.public_slug = :slug', { slug })
      .orderBy('campaign_branch.created_at', 'ASC')
      .getRawOne()) as PublicOfferRow | null;

    if (!row) {
      return null;
    }

    return this.mapOfferDetails(row);
  }

  async findCampaignById(campaignId: string): Promise<{ id: string } | null> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
    });

    if (!campaign || campaign.deletedAt) {
      return null;
    }

    return { id: campaign.id };
  }

  async findActiveSourceByTrackingToken(
    campaignId: string,
    trackingToken: string,
  ): Promise<AttributionContext | null> {
    const source = await this.sourceRepository.findOne({
      where: {
        campaignId,
        trackingToken,
        status: 'ACTIVE',
      },
    });

    return source ? this.mapAttributionSource(source) : null;
  }

  async findActiveSystemSource(
    campaignId: string,
    sourceType: 'DIRECT' | 'COUPONHUB_SEARCH',
  ): Promise<AttributionContext | null> {
    const source = await this.sourceRepository.findOne({
      where: {
        campaignId,
        sourceType,
        status: 'ACTIVE',
      },
    });

    return source ? this.mapAttributionSource(source) : null;
  }

  async insertCampaignVisit(input: {
    campaignId: string;
    sourceId: string;
    userId: string | null;
    visitorHash: string | null;
  }): Promise<void> {
    await this.campaignVisitRepository.save(
      this.campaignVisitRepository.create({
        campaignId: input.campaignId,
        sourceId: input.sourceId,
        userId: input.userId,
        visitorHash: input.visitorHash,
      }),
    );
  }

  private baseOfferQuery() {
    return this.campaignRepository
      .createQueryBuilder('campaign')
      .innerJoin(
        BusinessOrmEntity,
        'business',
        'business.id = campaign.business_id',
      )
      .innerJoin(
        CampaignBenefitOrmEntity,
        'benefit',
        'benefit.campaign_id = campaign.id',
      )
      .innerJoin(
        CampaignLimitOrmEntity,
        'campaign_limit',
        'campaign_limit.campaign_id = campaign.id',
      )
      .innerJoin(
        CampaignBranchOrmEntity,
        'campaign_branch',
        'campaign_branch.campaign_id = campaign.id AND campaign_branch.business_id = campaign.business_id',
      )
      .innerJoin(
        BranchOrmEntity,
        'branch',
        'branch.id = campaign_branch.branch_id AND branch.deleted_at IS NULL',
      )
      .innerJoin(
        CategoryOrmEntity,
        'category',
        'category.id = campaign.primary_category_id',
      )
      .leftJoin(
        CampaignPerformanceViewEntity,
        'performance',
        'performance.campaign_id = campaign.id',
      )
      .select('campaign.id', 'campaign_id')
      .addSelect('campaign.public_slug', 'campaign_slug')
      .addSelect('campaign.title', 'campaign_title')
      .addSelect('campaign.title_en', 'campaign_title_en')
      .addSelect('campaign.image_url', 'campaign_image_url')
      .addSelect('campaign.description', 'campaign_description')
      .addSelect('campaign.description_en', 'campaign_description_en')
      .addSelect('campaign.terms_text', 'campaign_terms_text')
      .addSelect('campaign.terms_text_en', 'campaign_terms_text_en')
      .addSelect('campaign.start_at', 'campaign_start_at')
      .addSelect('campaign.end_at', 'campaign_end_at')
      .addSelect('campaign.status', 'campaign_status')
      .addSelect('campaign.is_searchable', 'campaign_is_searchable')
      .addSelect('business.id', 'business_id')
      .addSelect('business.display_name', 'business_display_name')
      .addSelect('business.display_name_en', 'business_display_name_en')
      .addSelect('business.slug', 'business_slug')
      .addSelect('business.logo_url', 'business_logo_url')
      .addSelect('business.phone', 'business_phone')
      .addSelect('business.status', 'business_status')
      .addSelect('branch.id', 'branch_id')
      .addSelect('branch.name', 'branch_name')
      .addSelect('branch.name_en', 'branch_name_en')
      .addSelect('branch.address_line', 'branch_address_line')
      .addSelect('branch.address_line_en', 'branch_address_line_en')
      .addSelect('branch.phone', 'branch_phone')
      .addSelect('category.id', 'category_id')
      .addSelect('category.parent_id', 'category_parent_id')
      .addSelect('category.name_ar', 'category_name_ar')
      .addSelect('category.name_en', 'category_name_en')
      .addSelect('category.slug', 'category_slug')
      .addSelect('category.icon_url', 'category_icon_url')
      .addSelect('category.sort_order', 'category_sort_order')
      .addSelect('category.status', 'category_status')
      .addSelect('benefit.benefit_type', 'benefit_type')
      .addSelect('benefit.percentage_value', 'benefit_percentage_value')
      .addSelect('benefit.fixed_amount', 'benefit_fixed_amount')
      .addSelect('benefit.currency', 'benefit_currency')
      .addSelect('benefit.max_discount_amount', 'benefit_max_discount_amount')
      .addSelect('campaign_limit.total_claim_limit', 'total_claim_limit')
      .addSelect(
        'COALESCE(performance.remaining_quota, campaign_limit.total_claim_limit)',
        'remaining_quota',
      );
  }

  private mapOfferCard(row: PublicOfferRow): OfferCardResponseDto {
    const remainingQuota = this.toNumber(row.remaining_quota, row.total_claim_limit);

    return {
      id: row.campaign_id,
      slug: row.campaign_slug,
      title: row.campaign_title,
      titleEn: row.campaign_title_en ?? row.campaign_title,
      imageUrl: row.campaign_image_url,
      business: {
        id: row.business_id,
        displayName: row.business_display_name,
        displayNameEn: row.business_display_name_en ?? row.business_display_name,
        slug: row.business_slug,
        logoUrl: row.business_logo_url,
        phone: row.business_phone,
        status: row.business_status,
        primaryBranch: {
          id: row.branch_id,
          name: row.branch_name,
          nameEn: row.branch_name_en ?? row.branch_name,
          addressLine: row.branch_address_line,
          addressLineEn: row.branch_address_line_en ?? row.branch_address_line,
          phone: row.branch_phone,
        },
      },
      benefit: {
        type: row.benefit_type,
        percentageValue: this.toNullableNumber(row.benefit_percentage_value),
        fixedAmount: this.toNullableNumber(row.benefit_fixed_amount),
        currency: row.benefit_currency,
        maxDiscountAmount: this.toNullableNumber(row.benefit_max_discount_amount),
      },
      endAt: new Date(row.campaign_end_at).toISOString(),
      availability: this.resolveAvailability({
        status: row.campaign_status,
        businessStatus: row.business_status,
        isSearchable: row.campaign_is_searchable,
        startAt: new Date(row.campaign_start_at),
        endAt: new Date(row.campaign_end_at),
        remainingQuota,
      }),
    };
  }

  private mapOfferDetails(row: PublicOfferRow): OfferDetailsResponseDto {
    const card = this.mapOfferCard(row);
    const remainingQuota = this.toNumber(row.remaining_quota, row.total_claim_limit);

    return {
      ...card,
      description: row.campaign_description,
      descriptionEn: row.campaign_description_en ?? row.campaign_description,
      termsText: row.campaign_terms_text,
      termsTextEn: row.campaign_terms_text_en ?? row.campaign_terms_text,
      startAt: new Date(row.campaign_start_at).toISOString(),
      remainingQuota,
      category: this.mapCategory(row),
    };
  }

  private mapCategory(row: PublicOfferRow): CategoryResponseDto {
    return {
      id: row.category_id,
      parentId: row.category_parent_id,
      nameAr: row.category_name_ar,
      nameEn: row.category_name_en ?? row.category_name_ar,
      slug: row.category_slug,
      iconUrl: row.category_icon_url,
      sortOrder: Number(row.category_sort_order),
      status: row.category_status,
    };
  }

  private mapAttributionSource(source: CampaignSourceOrmEntity): AttributionContext {
    return {
      sourceId: source.id,
      sourceType: source.sourceType,
      trackingToken: source.trackingToken,
    };
  }

  private resolveAvailability(input: {
    status: string;
    businessStatus: string;
    isSearchable: boolean;
    startAt: Date;
    endAt: Date;
    remainingQuota: number;
  }): string {
    const now = new Date();

    if (input.businessStatus !== 'ACTIVE' || input.status === 'SUSPENDED') {
      return 'SUSPENDED';
    }

    if (!input.isSearchable) {
      return 'UNAVAILABLE';
    }

    if (input.status === 'EXPIRED' || input.endAt.getTime() < now.getTime()) {
      return 'EXPIRED';
    }

    if (input.startAt.getTime() > now.getTime()) {
      return 'NOT_STARTED';
    }

    if (input.remainingQuota <= 0) {
      return 'SOLD_OUT';
    }

    if (input.status === 'ACTIVE') {
      return 'AVAILABLE';
    }

    return 'UNAVAILABLE';
  }

  private toNullableNumber(value: string | null): number | null {
    return value === null ? null : Number(value);
  }

  private toNumber(value: number | string | null, fallback: number): number {
    if (value === null || value === undefined) {
      return fallback;
    }

    return typeof value === 'number' ? value : Number(value);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { CampaignSourceResponseDto } from '../../../../../campaigns/api/dto/campaign.response';
import { CampaignOrmEntity } from '../../../../../campaigns/infrastructure/persistence/typeorm/entities/campaign.orm-entity';
import { CampaignSourceOrmEntity } from '../../../../../campaigns/infrastructure/persistence/typeorm/entities/campaign-source.orm-entity';
import { BusinessOrmEntity } from '../../../../../organizations/infrastructure/persistence/typeorm/entities/business.orm-entity';
import { ListMyCouponsQueryDto } from '../../../../api/dto/coupon.query';
import {
  CouponDetailsResponseDto,
  CouponSummaryResponseDto,
} from '../../../../api/dto/coupon.response';
import { CouponReader } from '../../../../contracts/coupon-reader';
import { CouponIssuePolicy } from '../../../../domain/policies/coupon-issue.policy';
import { CouponOrmEntity } from '../entities/coupon.orm-entity';

type CouponDetailRow = {
  coupon_id: string;
  coupon_campaign_id: string;
  coupon_code: string;
  coupon_qr_token: string;
  coupon_status: string;
  coupon_issued_at: Date;
  coupon_expires_at: Date;
  campaign_title: string;
  campaign_public_slug: string;
  campaign_terms_text: string;
  business_display_name: string;
  business_logo_url: string | null;
  source_id: string;
  source_type: string;
  source_label: string;
  source_label_en: string | null;
  source_tracking_token: string;
  source_status: string;
  source_is_system_generated: boolean;
};

@Injectable()
export class TypeOrmCouponRepository implements CouponReader {
  constructor(
    @InjectRepository(CouponOrmEntity)
    private readonly repository: Repository<CouponOrmEntity>,
  ) {}

  async findByCampaignAndUser(
    campaignId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<CouponOrmEntity | null> {
    return this.getRepository(manager).findOne({
      where: { campaignId, userId },
    });
  }

  async countIssuedByCampaign(
    campaignId: string,
    manager?: EntityManager,
  ): Promise<number> {
    return this.getRepository(manager).count({
      where: { campaignId },
    });
  }

  async create(
    input: {
      campaignId: string;
      userId: string;
      sourceId: string;
      code: string;
      qrToken: string;
      issuedAt: Date;
      expiresAt: Date;
      status: string;
    },
    manager?: EntityManager,
  ): Promise<CouponOrmEntity> {
    const repository = this.getRepository(manager);

    return repository.save(
      repository.create({
        campaignId: input.campaignId,
        userId: input.userId,
        sourceId: input.sourceId,
        code: input.code,
        qrToken: input.qrToken,
        issuedAt: input.issuedAt,
        expiresAt: input.expiresAt,
        status: input.status,
      }),
    );
  }

  async existsById(couponId: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { id: couponId },
    });

    return count > 0;
  }

  async listForUser(
    userId: string,
    query: ListMyCouponsQueryDto,
  ): Promise<{ items: CouponSummaryResponseDto[]; total: number }> {
    const now = new Date();
    const qb = this.baseDetailQuery()
      .where('coupon.user_id = :userId', { userId })
      .orderBy('coupon.issued_at', 'DESC')
      .addOrderBy('coupon.created_at', 'DESC')
      .offset((query.page - 1) * query.limit)
      .limit(query.limit);

    this.applyEffectiveStatusFilter(qb, query.status, now);

    const countQuery = this.baseDetailQuery()
      .select('coupon.id', 'coupon_id')
      .where('coupon.user_id = :userId', { userId });

    this.applyEffectiveStatusFilter(countQuery, query.status, now);
    const total = await countQuery.getCount();

    const rows = (await qb.getRawMany()) as CouponDetailRow[];

    return {
      items: rows.map((row) => this.mapSummary(row, now)),
      total,
    };
  }

  async findDetailsForUser(
    couponId: string,
    userId: string,
  ): Promise<CouponDetailsResponseDto | null> {
    const row = (await this.baseDetailQuery()
      .where('coupon.id = :couponId', { couponId })
      .andWhere('coupon.user_id = :userId', { userId })
      .getRawOne()) as CouponDetailRow | null;

    return row ? this.mapDetails(row) : null;
  }

  private baseDetailQuery() {
    return this.repository
      .createQueryBuilder('coupon')
      .innerJoin(
        CampaignOrmEntity,
        'campaign',
        'campaign.id = coupon.campaign_id AND campaign.deleted_at IS NULL',
      )
      .innerJoin(
        BusinessOrmEntity,
        'business',
        'business.id = campaign.business_id AND business.deleted_at IS NULL',
      )
      .innerJoin(
        CampaignSourceOrmEntity,
        'source',
        'source.id = coupon.source_id AND source.campaign_id = coupon.campaign_id',
      )
      .select('coupon.id', 'coupon_id')
      .addSelect('coupon.campaign_id', 'coupon_campaign_id')
      .addSelect('coupon.code', 'coupon_code')
      .addSelect('coupon.qr_token', 'coupon_qr_token')
      .addSelect('coupon.status', 'coupon_status')
      .addSelect('coupon.issued_at', 'coupon_issued_at')
      .addSelect('coupon.expires_at', 'coupon_expires_at')
      .addSelect('campaign.title', 'campaign_title')
      .addSelect('campaign.public_slug', 'campaign_public_slug')
      .addSelect('campaign.terms_text', 'campaign_terms_text')
      .addSelect('business.display_name', 'business_display_name')
      .addSelect('business.logo_url', 'business_logo_url')
      .addSelect('source.id', 'source_id')
      .addSelect('source.source_type', 'source_type')
      .addSelect('source.label', 'source_label')
      .addSelect('source.label_en', 'source_label_en')
      .addSelect('source.tracking_token', 'source_tracking_token')
      .addSelect('source.status', 'source_status')
      .addSelect('source.is_system_generated', 'source_is_system_generated');
  }

  private applyEffectiveStatusFilter(
    qb: SelectQueryBuilder<CouponOrmEntity>,
    status: string | undefined,
    now: Date,
  ): void {
    if (!status) {
      return;
    }

    if (status === 'AVAILABLE') {
      qb.andWhere('coupon.status = :availableStatus', {
        availableStatus: 'AVAILABLE',
      }).andWhere('coupon.expires_at >= :now', { now });
      return;
    }

    if (status === 'EXPIRED') {
      qb.andWhere('coupon.status = :availableStatus', {
        availableStatus: 'AVAILABLE',
      }).andWhere('coupon.expires_at < :now', { now });
      return;
    }

    qb.andWhere('coupon.status = :status', { status });
  }

  private mapSummary(
    row: CouponDetailRow,
    now = new Date(),
  ): CouponSummaryResponseDto {
    const expiresAt = new Date(row.coupon_expires_at);

    return {
      id: row.coupon_id,
      campaignId: row.coupon_campaign_id,
      code: row.coupon_code,
      status: row.coupon_status,
      effectiveStatus: CouponIssuePolicy.resolveEffectiveStatus({
        status: row.coupon_status,
        expiresAt,
        now,
      }),
      issuedAt: new Date(row.coupon_issued_at).toISOString(),
      expiresAt: expiresAt.toISOString(),
      offerTitle: row.campaign_title,
      businessName: row.business_display_name,
    };
  }

  private mapDetails(row: CouponDetailRow): CouponDetailsResponseDto {
    return {
      ...this.mapSummary(row),
      qrToken: row.coupon_qr_token,
      source: this.mapSource(row),
      termsText: row.campaign_terms_text,
      businessLogoUrl: row.business_logo_url,
    };
  }

  private mapSource(row: CouponDetailRow): CampaignSourceResponseDto {
    return {
      id: row.source_id,
      sourceType: row.source_type,
      label: row.source_label,
      labelEn: row.source_label_en,
      trackingToken: row.source_tracking_token,
      status: row.source_status,
      isSystemGenerated: row.source_is_system_generated,
      trackingUrl: `/offers/${row.campaign_public_slug}?src=${row.source_tracking_token}`,
    };
  }

  private getRepository(manager?: EntityManager): Repository<CouponOrmEntity> {
    return manager ? manager.getRepository(CouponOrmEntity) : this.repository;
  }
}

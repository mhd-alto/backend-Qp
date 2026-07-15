import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  name: 'campaign_source_performance',
  expression: 'SELECT * FROM campaign_source_performance',
  synchronize: false,
})
export class CampaignSourcePerformanceViewEntity {
  @ViewColumn({ name: 'source_id' })
  sourceId!: string;

  @ViewColumn({ name: 'campaign_id' })
  campaignId!: string;

  @ViewColumn({ name: 'business_id' })
  businessId!: string;

  @ViewColumn({ name: 'source_type' })
  sourceType!: string;

  @ViewColumn({ name: 'label' })
  label!: string;

  @ViewColumn({ name: 'status' })
  status!: string;

  @ViewColumn({ name: 'total_visits' })
  totalVisits!: string;

  @ViewColumn({ name: 'issued_coupons' })
  issuedCoupons!: string;

  @ViewColumn({ name: 'confirmed_redemptions' })
  confirmedRedemptions!: string;

  @ViewColumn({ name: 'claim_rate_percent' })
  claimRatePercent!: string;

  @ViewColumn({ name: 'redemption_rate_percent' })
  redemptionRatePercent!: string;
}

import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  name: 'campaign_performance_summary',
  expression: 'SELECT * FROM campaign_performance_summary',
  synchronize: false,
})
export class CampaignPerformanceViewEntity {
  @ViewColumn({ name: 'campaign_id' })
  campaignId!: string;

  @ViewColumn({ name: 'business_id' })
  businessId!: string;

  @ViewColumn({ name: 'title' })
  title!: string;

  @ViewColumn({ name: 'status' })
  status!: string;

  @ViewColumn({ name: 'total_claim_limit' })
  totalClaimLimit!: number;

  @ViewColumn({ name: 'total_visits' })
  totalVisits!: string;

  @ViewColumn({ name: 'known_unique_users' })
  knownUniqueUsers!: string;

  @ViewColumn({ name: 'anonymous_unique_visitors' })
  anonymousUniqueVisitors!: string;

  @ViewColumn({ name: 'issued_coupons' })
  issuedCoupons!: string;

  @ViewColumn({ name: 'remaining_quota' })
  remainingQuota!: number;

  @ViewColumn({ name: 'available_coupons' })
  availableCoupons!: string;

  @ViewColumn({ name: 'redeemed_coupons' })
  redeemedCoupons!: string;

  @ViewColumn({ name: 'expired_coupons' })
  expiredCoupons!: string;

  @ViewColumn({ name: 'cancelled_coupons' })
  cancelledCoupons!: string;

  @ViewColumn({ name: 'confirmed_redemptions' })
  confirmedRedemptions!: string;

  @ViewColumn({ name: 'reversed_redemptions' })
  reversedRedemptions!: string;

  @ViewColumn({ name: 'recorded_sales' })
  recordedSales!: string;

  @ViewColumn({ name: 'recorded_discount' })
  recordedDiscount!: string;

  @ViewColumn({ name: 'claim_rate_percent' })
  claimRatePercent!: string;

  @ViewColumn({ name: 'redemption_rate_percent' })
  redemptionRatePercent!: string;
}

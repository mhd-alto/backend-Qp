import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'campaign_limits', synchronize: false })
export class CampaignLimitOrmEntity {
  @PrimaryColumn({ name: 'campaign_id', type: 'uuid' })
  campaignId!: string;

  @Column({ name: 'total_claim_limit', type: 'integer' })
  totalClaimLimit!: number;

  @Column({ name: 'per_user_claim_limit', type: 'integer', default: 1 })
  perUserClaimLimit!: number;

  @Column({ name: 'max_redemptions_per_coupon', type: 'integer', default: 1 })
  maxRedemptionsPerCoupon!: number;

  @Column({ name: 'budget_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  budgetAmount!: string | null;

  @Column({ type: 'char', length: 3, nullable: true })
  currency!: string | null;

  @Column({ name: 'coupon_validity_type', type: 'varchar', length: 30, default: 'CAMPAIGN_END' })
  couponValidityType!: string;

  @Column({ name: 'coupon_validity_minutes', type: 'integer', nullable: true })
  couponValidityMinutes!: number | null;

  @Column({ name: 'coupon_absolute_expires_at', type: 'timestamptz', nullable: true })
  couponAbsoluteExpiresAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

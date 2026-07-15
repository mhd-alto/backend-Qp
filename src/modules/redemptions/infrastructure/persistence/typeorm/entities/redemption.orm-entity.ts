import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'redemptions', synchronize: false })
export class RedemptionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'coupon_id', type: 'uuid' })
  couponId!: string;

  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId!: string;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'redeemed_by_membership_id', type: 'uuid' })
  redeemedByMembershipId!: string;

  @Column({ name: 'invoice_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  invoiceAmount!: string | null;

  @Column({ name: 'original_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  originalAmount!: string | null;

  @Column({ name: 'discount_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  discountAmount!: string | null;

  @Column({ name: 'final_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  finalAmount!: string | null;

  @Column({ type: 'char', length: 3, nullable: true })
  currency!: string | null;

  @Column({ name: 'currency_code', type: 'varchar', length: 3, default: 'SYP' })
  currencyCode!: string;

  @Column({ type: 'varchar', length: 20, default: 'CONFIRMED' })
  status!: string;

  @Column({ name: 'redeemed_at', type: 'timestamptz', default: () => 'now()' })
  redeemedAt!: Date;

  @Column({ name: 'reversed_at', type: 'timestamptz', nullable: true })
  reversedAt!: Date | null;

  @Column({ name: 'reversed_by_user_id', type: 'uuid', nullable: true })
  reversedByUserId!: string | null;

  @Column({ name: 'reversal_reason', type: 'text', nullable: true })
  reversalReason!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'campaign_benefits', synchronize: false })
export class CampaignBenefitOrmEntity {
  @PrimaryColumn({ name: 'campaign_id', type: 'uuid' })
  campaignId!: string;

  @Column({ name: 'benefit_type', type: 'varchar', length: 30 })
  benefitType!: string;

  @Column({ name: 'percentage_value', type: 'numeric', precision: 5, scale: 2, nullable: true })
  percentageValue!: string | null;

  @Column({ name: 'fixed_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  fixedAmount!: string | null;

  @Column({ name: 'max_discount_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  maxDiscountAmount!: string | null;

  @Column({ type: 'char', length: 3, default: 'SYP' })
  currency!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'description_en', type: 'text', nullable: true })
  descriptionEn!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

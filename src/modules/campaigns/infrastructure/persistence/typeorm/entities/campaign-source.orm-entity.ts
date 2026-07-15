import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'campaign_sources', synchronize: false })
export class CampaignSourceOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId!: string;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId!: string;

  @Column({ name: 'created_by_membership_id', type: 'uuid', nullable: true })
  createdByMembershipId!: string | null;

  @Column({ name: 'source_type', type: 'varchar', length: 30 })
  sourceType!: string;

  @Column({ type: 'varchar', length: 150 })
  label!: string;

  @Column({ name: 'label_en', type: 'varchar', length: 150, nullable: true })
  labelEn!: string | null;

  @Column({ name: 'tracking_token', type: 'varchar', length: 64 })
  trackingToken!: string;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status!: string;

  @Column({ name: 'is_system_generated', type: 'boolean', default: false })
  isSystemGenerated!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'campaigns', synchronize: false })
export class CampaignOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId!: string;

  @Column({ name: 'primary_category_id', type: 'uuid' })
  primaryCategoryId!: string;

  @Column({ name: 'created_by_membership_id', type: 'uuid' })
  createdByMembershipId!: string;

  @Column({ name: 'submitted_by_membership_id', type: 'uuid', nullable: true })
  submittedByMembershipId!: string | null;

  @Column({ name: 'reviewed_by_user_id', type: 'uuid', nullable: true })
  reviewedByUserId!: string | null;

  @Column({ name: 'suspended_by_user_id', type: 'uuid', nullable: true })
  suspendedByUserId!: string | null;

  @Column({ type: 'varchar', length: 180 })
  title!: string;

  @Column({ name: 'title_en', type: 'varchar', length: 180, nullable: true })
  titleEn!: string | null;

  @Column({ name: 'public_slug', type: 'varchar', length: 200 })
  publicSlug!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'description_en', type: 'text', nullable: true })
  descriptionEn!: string | null;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl!: string | null;

  @Column({ name: 'terms_text', type: 'text' })
  termsText!: string;

  @Column({ name: 'terms_text_en', type: 'text', nullable: true })
  termsTextEn!: string | null;

  @Column({ type: 'varchar', length: 30, default: 'DRAFT' })
  status!: string;

  @Column({ name: 'start_at', type: 'timestamptz' })
  startAt!: Date;

  @Column({ name: 'end_at', type: 'timestamptz' })
  endAt!: Date;

  @Column({ name: 'is_searchable', type: 'boolean', default: true })
  isSearchable!: boolean;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt!: Date | null;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt!: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason!: string | null;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @Column({ name: 'suspended_at', type: 'timestamptz', nullable: true })
  suspendedAt!: Date | null;

  @Column({ name: 'suspension_reason', type: 'text', nullable: true })
  suspensionReason!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}

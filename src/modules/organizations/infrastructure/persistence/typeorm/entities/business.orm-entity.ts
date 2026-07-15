import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'businesses', synchronize: false })
export class BusinessOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'legal_name', type: 'varchar', length: 180, nullable: true })
  legalName!: string | null;

  @Column({ name: 'display_name', type: 'varchar', length: 180 })
  displayName!: string;

  @Column({ name: 'display_name_en', type: 'varchar', length: 180, nullable: true })
  displayNameEn!: string | null;

  @Column({ type: 'varchar', length: 180 })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'description_en', type: 'text', nullable: true })
  descriptionEn!: string | null;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl!: string | null;

  @Column({ name: 'cover_url', type: 'text', nullable: true })
  coverUrl!: string | null;

  @Column({ type: 'citext', nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 20 })
  phone!: string;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status!: string;

  @Column({ name: 'created_by_user_id', type: 'uuid' })
  createdByUserId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}

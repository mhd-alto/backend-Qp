import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'branches', synchronize: false })
export class BranchOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ name: 'name_en', type: 'varchar', length: 150, nullable: true })
  nameEn!: string | null;

  @Column({ type: 'varchar', length: 150 })
  slug!: string;

  @Column({ name: 'address_line', type: 'text' })
  addressLine!: string;

  @Column({ name: 'address_line_en', type: 'text', nullable: true })
  addressLineEn!: string | null;

  @Column({ name: 'location_id', type: 'uuid', nullable: true })
  locationId!: string | null;

  @Column({ type: 'numeric', precision: 9, scale: 6, nullable: true })
  latitude!: string | null;

  @Column({ type: 'numeric', precision: 9, scale: 6, nullable: true })
  longitude!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary!: boolean;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'locations', synchronize: false })
export class LocationOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId!: string | null;

  @Column({ type: 'varchar', length: 20 })
  type!: string;

  @Column({ name: 'name_ar', type: 'varchar', length: 120 })
  nameAr!: string;

  @Column({ name: 'name_en', type: 'varchar', length: 120, nullable: true })
  nameEn!: string | null;

  @Column({ type: 'varchar', length: 150 })
  slug!: string;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

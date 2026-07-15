import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'categories', synchronize: false })
export class CategoryOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId!: string | null;

  @Column({ name: 'name_ar', type: 'varchar', length: 100 })
  nameAr!: string;

  @Column({ name: 'name_en', type: 'varchar', length: 100, nullable: true })
  nameEn!: string | null;

  @Column({ type: 'varchar', length: 120 })
  slug!: string;

  @Column({ name: 'icon_url', type: 'text', nullable: true })
  iconUrl!: string | null;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder!: number;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

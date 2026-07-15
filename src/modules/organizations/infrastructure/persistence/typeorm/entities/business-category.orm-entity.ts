import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'business_categories', synchronize: false })
export class BusinessCategoryOrmEntity {
  @PrimaryColumn({ name: 'business_id', type: 'uuid' })
  businessId!: string;

  @PrimaryColumn({ name: 'category_id', type: 'uuid' })
  categoryId!: string;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

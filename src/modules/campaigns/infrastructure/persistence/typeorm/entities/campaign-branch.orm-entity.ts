import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'campaign_branches', synchronize: false })
export class CampaignBranchOrmEntity {
  @PrimaryColumn({ name: 'campaign_id', type: 'uuid' })
  campaignId!: string;

  @PrimaryColumn({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @PrimaryColumn({ name: 'business_id', type: 'uuid' })
  businessId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

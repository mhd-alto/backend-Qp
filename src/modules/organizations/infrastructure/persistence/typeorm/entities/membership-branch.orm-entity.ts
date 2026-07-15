import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'membership_branches', synchronize: false })
export class MembershipBranchOrmEntity {
  @PrimaryColumn({ name: 'membership_id', type: 'uuid' })
  membershipId!: string;

  @PrimaryColumn({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @PrimaryColumn({ name: 'business_id', type: 'uuid' })
  businessId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

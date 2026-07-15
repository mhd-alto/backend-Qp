import { EntityManager } from 'typeorm';

export interface MembershipBranchRepository {
  assignToBranch(
    membershipId: string,
    branchId: string,
    businessId: string,
    manager?: EntityManager,
  ): Promise<void>;
}

export const MEMBERSHIP_BRANCH_REPOSITORY = Symbol('MEMBERSHIP_BRANCH_REPOSITORY');

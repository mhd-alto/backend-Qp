import { EntityManager } from 'typeorm';

export type BusinessMembershipRecord = {
  id: string;
  businessId: string;
  userId: string;
  role: string;
  status: string;
  invitedByUserId: string | null;
  joinedAt: Date | null;
};

export type CreateBusinessMembershipInput = {
  businessId: string;
  userId: string;
  role: string;
  status: string;
  invitedByUserId: string | null;
  joinedAt: Date | null;
};

export interface BusinessMembershipRepository {
  create(
    input: CreateBusinessMembershipInput,
    manager?: EntityManager,
  ): Promise<BusinessMembershipRecord>;
  findByBusinessAndUser(
    businessId: string,
    userId: string,
  ): Promise<BusinessMembershipRecord | null>;
  findByIdAndBusiness(
    businessId: string,
    membershipId: string,
  ): Promise<BusinessMembershipRecord | null>;
  listByBusiness(businessId: string): Promise<BusinessMembershipRecord[]>;
  updateStatus(
    membershipId: string,
    status: string,
    manager?: EntityManager,
  ): Promise<BusinessMembershipRecord>;
  countActiveOwners(businessId: string): Promise<number>;
  findActiveOwnerMembershipByUserId(userId: string): Promise<BusinessMembershipRecord | null>;
}

export const BUSINESS_MEMBERSHIP_REPOSITORY = Symbol('BUSINESS_MEMBERSHIP_REPOSITORY');

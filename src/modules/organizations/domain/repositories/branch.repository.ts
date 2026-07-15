import { EntityManager } from 'typeorm';

export type BranchRecord = {
  id: string;
  businessId: string;
  name: string;
  nameEn: string | null;
  slug: string;
  addressLine: string;
  addressLineEn: string | null;
  locationId: string | null;
  phone: string | null;
  isPrimary: boolean;
  status: string;
};

export type CreateBranchInput = {
  businessId: string;
  name: string;
  nameEn: string | null;
  slug: string;
  addressLine: string;
  addressLineEn: string | null;
  locationId: string | null;
  phone: string | null;
  isPrimary: boolean;
};

export type UpdateBranchInput = Partial<
  Omit<CreateBranchInput, 'businessId' | 'isPrimary'> & { status: string }
>;

export interface BranchRepository {
  findPrimaryByBusinessId(businessId: string): Promise<BranchRecord | null>;
  findByBusinessAndSlug(businessId: string, slug: string): Promise<BranchRecord | null>;
  create(input: CreateBranchInput, manager?: EntityManager): Promise<BranchRecord>;
  update(id: string, input: UpdateBranchInput, manager?: EntityManager): Promise<BranchRecord>;
}

export const BRANCH_REPOSITORY = Symbol('BRANCH_REPOSITORY');

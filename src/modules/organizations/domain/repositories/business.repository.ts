import { EntityManager } from 'typeorm';

export type BusinessRecord = {
  id: string;
  legalName: string | null;
  displayName: string;
  displayNameEn: string | null;
  slug: string;
  description: string | null;
  descriptionEn: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  email: string | null;
  phone: string;
  status: string;
  createdByUserId: string;
};

export type CreateBusinessInput = {
  legalName: string | null;
  displayName: string;
  displayNameEn: string | null;
  slug: string;
  description: string | null;
  descriptionEn: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  email: string | null;
  phone: string;
  createdByUserId: string;
};

export type UpdateBusinessInput = Partial<
  Omit<CreateBusinessInput, 'createdByUserId'> & { status: string }
>;

export interface BusinessRepository {
  findById(id: string): Promise<BusinessRecord | null>;
  findBySlug(slug: string): Promise<BusinessRecord | null>;
  create(input: CreateBusinessInput, manager?: EntityManager): Promise<BusinessRecord>;
  update(id: string, input: UpdateBusinessInput, manager?: EntityManager): Promise<BusinessRecord>;
}

export const BUSINESS_REPOSITORY = Symbol('BUSINESS_REPOSITORY');

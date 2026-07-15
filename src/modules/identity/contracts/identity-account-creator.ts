import { EntityManager } from 'typeorm';

export type CreateCustomerAccountInput = {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  passwordHash: string;
  policyVersion: string;
};

export type IdentityUserSummary = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  platformRole: string;
  status: string;
};

export interface IdentityAccountCreator {
  createCustomerAccount(
    input: CreateCustomerAccountInput,
    manager?: EntityManager,
  ): Promise<IdentityUserSummary>;
}

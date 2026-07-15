import { EntityManager } from 'typeorm';

export type CreateUserConsentInput = {
  userId: string;
  consentType: string;
  status: string;
  policyVersion: string;
  grantedAt: Date | null;
  revokedAt?: Date | null;
};

export interface UserConsentRepository {
  createMany(
    input: CreateUserConsentInput[],
    manager?: EntityManager,
  ): Promise<void>;
}

export const USER_CONSENT_REPOSITORY = Symbol('USER_CONSENT_REPOSITORY');

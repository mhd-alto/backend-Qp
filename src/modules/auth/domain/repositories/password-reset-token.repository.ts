import { EntityManager } from 'typeorm';

export type PasswordResetTokenRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

export type CreatePasswordResetTokenInput = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

export interface PasswordResetTokenRepository {
  create(
    input: CreatePasswordResetTokenInput,
    manager?: EntityManager,
  ): Promise<PasswordResetTokenRecord>;
  findActiveByTokenHash(tokenHash: string): Promise<PasswordResetTokenRecord | null>;
  markUsed(tokenId: string, usedAt: Date, manager?: EntityManager): Promise<void>;
}

export const PASSWORD_RESET_TOKEN_REPOSITORY = Symbol(
  'PASSWORD_RESET_TOKEN_REPOSITORY',
);

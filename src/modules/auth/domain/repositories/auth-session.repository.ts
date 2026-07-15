import { EntityManager } from 'typeorm';

export type AuthSessionRecord = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  userAgent: string | null;
  ipHash: string | null;
  expiresAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  revocationReason: string | null;
};

export type CreateAuthSessionInput = {
  id?: string;
  userId: string;
  refreshTokenHash: string;
  userAgent: string | null;
  ipHash: string | null;
  expiresAt: Date;
  lastUsedAt: Date | null;
};

export type UpdateAuthSessionInput = {
  id: string;
  refreshTokenHash: string;
  expiresAt: Date;
  lastUsedAt: Date | null;
};

export interface AuthSessionRepository {
  create(
    input: CreateAuthSessionInput,
    manager?: EntityManager,
  ): Promise<AuthSessionRecord>;
  update(
    input: UpdateAuthSessionInput,
    manager?: EntityManager,
  ): Promise<AuthSessionRecord>;
  findActiveById(sessionId: string): Promise<AuthSessionRecord | null>;
  revokeById(
    sessionId: string,
    reason: string,
    manager?: EntityManager,
  ): Promise<void>;
  revokeAllByUserId(
    userId: string,
    reason: string,
    manager?: EntityManager,
  ): Promise<void>;
}

export const AUTH_SESSION_REPOSITORY = Symbol('AUTH_SESSION_REPOSITORY');

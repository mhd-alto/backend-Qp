import { EntityManager } from 'typeorm';

export type UserRecord = {
  id: string;
  email: string | null;
  phone: string | null;
  passwordHash: string;
  platformRole: string;
  status: string;
  lastLoginAt: Date | null;
  deletedAt: Date | null;
};

export type CreateUserInput = {
  email: string | null;
  phone: string | null;
  passwordHash: string;
  platformRole: string;
  status: string;
};

export interface UserRepository {
  findActiveByIdentifier(input: {
    email?: string | null;
    phone?: string | null;
  }): Promise<UserRecord | null>;
  findById(userId: string): Promise<UserRecord | null>;
  create(input: CreateUserInput, manager?: EntityManager): Promise<UserRecord>;
  updateLastLoginAt(
    userId: string,
    lastLoginAt: Date,
    manager?: EntityManager,
  ): Promise<void>;
  updatePasswordHash(
    userId: string,
    passwordHash: string,
    manager?: EntityManager,
  ): Promise<void>;
  updateStatus(
    userId: string,
    status: string,
    manager?: EntityManager,
  ): Promise<void>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

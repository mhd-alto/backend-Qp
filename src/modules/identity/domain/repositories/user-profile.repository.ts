import { EntityManager } from 'typeorm';

export type UserProfileRecord = {
  userId: string;
  fullName: string;
  locationId: string | null;
  avatarUrl: string | null;
};

export type CreateUserProfileInput = {
  userId: string;
  fullName: string;
};

export interface UserProfileRepository {
  create(
    input: CreateUserProfileInput,
    manager?: EntityManager,
  ): Promise<UserProfileRecord>;
  findByUserId(userId: string): Promise<UserProfileRecord | null>;
}

export const USER_PROFILE_REPOSITORY = Symbol('USER_PROFILE_REPOSITORY');

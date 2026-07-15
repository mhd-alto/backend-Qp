import { EntityManager } from 'typeorm';

export interface BusinessCategoryRepository {
  createPrimary(
    businessId: string,
    categoryId: string,
    manager?: EntityManager,
  ): Promise<void>;
  updatePrimary(
    businessId: string,
    categoryId: string,
    manager?: EntityManager,
  ): Promise<void>;
  findPrimaryCategoryId(businessId: string): Promise<string | null>;
}

export const BUSINESS_CATEGORY_REPOSITORY = Symbol('BUSINESS_CATEGORY_REPOSITORY');

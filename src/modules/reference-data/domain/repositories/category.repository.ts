import { Category, CategoryStatus } from '../entities/category';

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');

export type CreateCategoryInput = {
  parentId: string | null;
  nameAr: string;
  nameEn: string | null;
  slug: string;
  iconUrl: string | null;
  sortOrder: number;
};

export type UpdateCategoryInput = {
  parentId?: string | null;
  nameAr?: string;
  nameEn?: string | null;
  slug?: string;
  iconUrl?: string | null;
  sortOrder?: number;
  status?: CategoryStatus;
};

export interface CategoryRepository {
  findActive(): Promise<Category[]>;
  findAll(status?: CategoryStatus): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  findByParentAndNameAr(
    parentId: string | null,
    nameAr: string,
    excludeId?: string,
  ): Promise<Category | null>;
  create(input: CreateCategoryInput): Promise<Category>;
  update(id: string, input: UpdateCategoryInput): Promise<Category>;
}

import { Category, CategoryStatus } from '../domain/entities/category';

export const CATEGORY_READER = Symbol('CATEGORY_READER');

export interface CategoryReader {
  listActive(): Promise<Category[]>;
  listAll(status?: CategoryStatus): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
}

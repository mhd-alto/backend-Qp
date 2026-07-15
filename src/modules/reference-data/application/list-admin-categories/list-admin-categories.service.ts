import { Inject, Injectable } from '@nestjs/common';
import { Category, CategoryStatus } from '../../domain/entities/category';
import {
  CATEGORY_REPOSITORY,
  CategoryRepository,
} from '../../domain/repositories/category.repository';

@Injectable()
export class ListAdminCategoriesService {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepository,
  ) {}

  execute(status?: CategoryStatus): Promise<Category[]> {
    return this.categoryRepository.findAll(status);
  }
}

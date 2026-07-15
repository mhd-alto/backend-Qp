import { Inject, Injectable } from '@nestjs/common';
import { Category } from '../../domain/entities/category';
import {
  CATEGORY_REPOSITORY,
  CategoryRepository,
} from '../../domain/repositories/category.repository';
import { CategoryReader } from '../../contracts/category-reader';

@Injectable()
export class ListActiveCategoriesService implements CategoryReader {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: CategoryRepository,
  ) {}

  listActive(): Promise<Category[]> {
    return this.categoryRepository.findActive();
  }

  listAll() {
    return this.categoryRepository.findAll();
  }

  findById(id: string) {
    return this.categoryRepository.findById(id);
  }
}

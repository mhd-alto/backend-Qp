import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import {
  CategoryRepository,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../../../../domain/repositories/category.repository';
import { Category, CategoryStatus } from '../../../../domain/entities/category';
import { CategoryOrmEntity } from '../entities/category.orm-entity';

@Injectable()
export class TypeOrmCategoryRepository implements CategoryRepository {
  constructor(
    @InjectRepository(CategoryOrmEntity)
    private readonly repository: Repository<CategoryOrmEntity>,
  ) {}

  async findActive(): Promise<Category[]> {
    const items = await this.repository.find({
      where: { status: 'ACTIVE' },
      order: { sortOrder: 'ASC', nameAr: 'ASC' },
    });

    return items.map((item) => this.toDomain(item));
  }

  async findAll(status?: CategoryStatus): Promise<Category[]> {
    const items = await this.repository.find({
      where: status ? { status } : {},
      order: { sortOrder: 'ASC', nameAr: 'ASC' },
    });

    return items.map((item) => this.toDomain(item));
  }

  async findById(id: string): Promise<Category | null> {
    const item = await this.repository.findOne({ where: { id } });
    return item ? this.toDomain(item) : null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const item = await this.repository.findOne({ where: { slug } });
    return item ? this.toDomain(item) : null;
  }

  async findByParentAndNameAr(
    parentId: string | null,
    nameAr: string,
    excludeId?: string,
  ): Promise<Category | null> {
    const normalizedName = nameAr.trim().toLowerCase();
    const query = this.repository
      .createQueryBuilder('category')
      .where('LOWER(TRIM(category.name_ar)) = :normalizedName', { normalizedName });

    if (parentId === null) {
      query.andWhere('category.parent_id IS NULL');
    } else {
      query.andWhere('category.parent_id = :parentId', { parentId });
    }

    if (excludeId) {
      query.andWhere('category.id <> :excludeId', { excludeId });
    }

    const item = await query.getOne();
    return item ? this.toDomain(item) : null;
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    const entity = this.repository.create({
      parentId: input.parentId,
      nameAr: input.nameAr,
      nameEn: input.nameEn,
      slug: input.slug,
      iconUrl: input.iconUrl,
      sortOrder: input.sortOrder,
      status: 'ACTIVE',
    });

    const created = await this.repository.save(entity);
    return this.toDomain(created);
  }

  async update(id: string, input: UpdateCategoryInput): Promise<Category> {
    await this.repository.update({ id }, input);
    const updated = await this.repository.findOneOrFail({ where: { id } });
    return this.toDomain(updated);
  }

  private toDomain(entity: CategoryOrmEntity): Category {
    return {
      id: entity.id,
      parentId: entity.parentId,
      nameAr: entity.nameAr,
      nameEn: entity.nameEn,
      slug: entity.slug,
      iconUrl: entity.iconUrl,
      sortOrder: entity.sortOrder,
      status: entity.status as CategoryStatus,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}

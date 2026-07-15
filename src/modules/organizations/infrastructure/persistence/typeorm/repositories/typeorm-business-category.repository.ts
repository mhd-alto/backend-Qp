import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BusinessCategoryRepository } from '../../../../domain/repositories/business-category.repository';
import { BusinessCategoryOrmEntity } from '../entities/business-category.orm-entity';

@Injectable()
export class TypeOrmBusinessCategoryRepository
  implements BusinessCategoryRepository
{
  constructor(
    @InjectRepository(BusinessCategoryOrmEntity)
    private readonly repository: Repository<BusinessCategoryOrmEntity>,
  ) {}

  async createPrimary(
    businessId: string,
    categoryId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = this.getRepository(manager);
    await repository.save(
      repository.create({
        businessId,
        categoryId,
        isPrimary: true,
      }),
    );
  }

  async updatePrimary(
    businessId: string,
    categoryId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = this.getRepository(manager);
    await repository.update({ businessId }, { isPrimary: false });

    const existing = await repository.findOne({
      where: { businessId, categoryId },
    });

    if (existing) {
      await repository.update({ businessId, categoryId }, { isPrimary: true });
      return;
    }

    await repository.save(
      repository.create({
        businessId,
        categoryId,
        isPrimary: true,
      }),
    );
  }

  async findPrimaryCategoryId(businessId: string): Promise<string | null> {
    const entity = await this.repository.findOne({
      where: { businessId, isPrimary: true },
    });

    return entity?.categoryId ?? null;
  }

  private getRepository(
    manager?: EntityManager,
  ): Repository<BusinessCategoryOrmEntity> {
    return manager ? manager.getRepository(BusinessCategoryOrmEntity) : this.repository;
  }
}

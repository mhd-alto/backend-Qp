import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  BranchRecord,
  BranchRepository,
  CreateBranchInput,
  UpdateBranchInput,
} from '../../../../domain/repositories/branch.repository';
import { BranchOrmEntity } from '../entities/branch.orm-entity';

@Injectable()
export class TypeOrmBranchRepository implements BranchRepository {
  constructor(
    @InjectRepository(BranchOrmEntity)
    private readonly repository: Repository<BranchOrmEntity>,
  ) {}

  async findPrimaryByBusinessId(businessId: string): Promise<BranchRecord | null> {
    const entity = await this.repository
      .createQueryBuilder('branch')
      .where('branch.business_id = :businessId', { businessId })
      .andWhere('branch.is_primary = true')
      .andWhere('branch.deleted_at IS NULL')
      .getOne();

    return entity ? this.toRecord(entity) : null;
  }

  async findByBusinessAndSlug(
    businessId: string,
    slug: string,
  ): Promise<BranchRecord | null> {
    const entity = await this.repository
      .createQueryBuilder('branch')
      .where('branch.business_id = :businessId', { businessId })
      .andWhere('branch.slug = :slug', { slug })
      .andWhere('branch.deleted_at IS NULL')
      .getOne();

    return entity ? this.toRecord(entity) : null;
  }

  async create(
    input: CreateBranchInput,
    manager?: EntityManager,
  ): Promise<BranchRecord> {
    const repository = this.getRepository(manager);
    const entity = await repository.save(
      repository.create({
        ...input,
        status: 'ACTIVE',
      }),
    );

    return this.toRecord(entity);
  }

  async update(
    id: string,
    input: UpdateBranchInput,
    manager?: EntityManager,
  ): Promise<BranchRecord> {
    const repository = this.getRepository(manager);
    await repository.update({ id }, input);
    const entity = await repository.findOneOrFail({ where: { id } });
    return this.toRecord(entity);
  }

  private getRepository(manager?: EntityManager): Repository<BranchOrmEntity> {
    return manager ? manager.getRepository(BranchOrmEntity) : this.repository;
  }

  private toRecord(entity: BranchOrmEntity): BranchRecord {
    return {
      id: entity.id,
      businessId: entity.businessId,
      name: entity.name,
      nameEn: entity.nameEn,
      slug: entity.slug,
      addressLine: entity.addressLine,
      addressLineEn: entity.addressLineEn,
      locationId: entity.locationId,
      phone: entity.phone,
      isPrimary: entity.isPrimary,
      status: entity.status,
    };
  }
}

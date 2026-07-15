import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  BusinessRecord,
  BusinessRepository,
  CreateBusinessInput,
  UpdateBusinessInput,
} from '../../../../domain/repositories/business.repository';
import { BusinessOrmEntity } from '../entities/business.orm-entity';

@Injectable()
export class TypeOrmBusinessRepository implements BusinessRepository {
  constructor(
    @InjectRepository(BusinessOrmEntity)
    private readonly repository: Repository<BusinessOrmEntity>,
  ) {}

  async findById(id: string): Promise<BusinessRecord | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity && !entity.deletedAt ? this.toRecord(entity) : null;
  }

  async findBySlug(slug: string): Promise<BusinessRecord | null> {
    const entity = await this.repository.findOne({ where: { slug } });
    return entity && !entity.deletedAt ? this.toRecord(entity) : null;
  }

  async create(
    input: CreateBusinessInput,
    manager?: EntityManager,
  ): Promise<BusinessRecord> {
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
    input: UpdateBusinessInput,
    manager?: EntityManager,
  ): Promise<BusinessRecord> {
    const repository = this.getRepository(manager);
    await repository.update({ id }, input);
    const entity = await repository.findOneOrFail({ where: { id } });
    return this.toRecord(entity);
  }

  private getRepository(manager?: EntityManager): Repository<BusinessOrmEntity> {
    return manager ? manager.getRepository(BusinessOrmEntity) : this.repository;
  }

  private toRecord(entity: BusinessOrmEntity): BusinessRecord {
    return {
      id: entity.id,
      legalName: entity.legalName,
      displayName: entity.displayName,
      displayNameEn: entity.displayNameEn,
      slug: entity.slug,
      description: entity.description,
      descriptionEn: entity.descriptionEn,
      logoUrl: entity.logoUrl,
      coverUrl: entity.coverUrl,
      email: entity.email,
      phone: entity.phone,
      status: entity.status,
      createdByUserId: entity.createdByUserId,
    };
  }
}

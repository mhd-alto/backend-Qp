import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  BusinessMembershipRecord,
  BusinessMembershipRepository,
  CreateBusinessMembershipInput,
} from '../../../../domain/repositories/business-membership.repository';
import { BusinessMembershipOrmEntity } from '../entities/business-membership.orm-entity';

@Injectable()
export class TypeOrmBusinessMembershipRepository
  implements BusinessMembershipRepository
{
  constructor(
    @InjectRepository(BusinessMembershipOrmEntity)
    private readonly repository: Repository<BusinessMembershipOrmEntity>,
  ) {}

  async create(
    input: CreateBusinessMembershipInput,
    manager?: EntityManager,
  ): Promise<BusinessMembershipRecord> {
    const repository = this.getRepository(manager);
    const entity = await repository.save(repository.create(input));
    return this.toRecord(entity);
  }

  async findByBusinessAndUser(
    businessId: string,
    userId: string,
  ): Promise<BusinessMembershipRecord | null> {
    const entity = await this.repository.findOne({ where: { businessId, userId } });
    return entity ? this.toRecord(entity) : null;
  }

  async findByIdAndBusiness(
    businessId: string,
    membershipId: string,
  ): Promise<BusinessMembershipRecord | null> {
    const entity = await this.repository.findOne({
      where: { businessId, id: membershipId },
    });
    return entity ? this.toRecord(entity) : null;
  }

  async listByBusiness(businessId: string): Promise<BusinessMembershipRecord[]> {
    const items = await this.repository.find({
      where: { businessId },
      order: { createdAt: 'ASC' },
    });
    return items.map((item) => this.toRecord(item));
  }

  async updateStatus(
    membershipId: string,
    status: string,
    manager?: EntityManager,
  ): Promise<BusinessMembershipRecord> {
    const repository = this.getRepository(manager);
    await repository.update({ id: membershipId }, { status });
    const entity = await repository.findOneOrFail({ where: { id: membershipId } });
    return this.toRecord(entity);
  }

  countActiveOwners(businessId: string): Promise<number> {
    return this.repository.count({
      where: { businessId, role: 'OWNER', status: 'ACTIVE' },
    });
  }

  async findActiveOwnerMembershipByUserId(
    userId: string,
  ): Promise<BusinessMembershipRecord | null> {
    const entity = await this.repository.findOne({
      where: { userId, role: 'OWNER', status: 'ACTIVE' },
      order: { createdAt: 'ASC' },
    });
    return entity ? this.toRecord(entity) : null;
  }

  private getRepository(
    manager?: EntityManager,
  ): Repository<BusinessMembershipOrmEntity> {
    return manager ? manager.getRepository(BusinessMembershipOrmEntity) : this.repository;
  }

  private toRecord(entity: BusinessMembershipOrmEntity): BusinessMembershipRecord {
    return {
      id: entity.id,
      businessId: entity.businessId,
      userId: entity.userId,
      role: entity.role,
      status: entity.status,
      invitedByUserId: entity.invitedByUserId,
      joinedAt: entity.joinedAt,
    };
  }
}

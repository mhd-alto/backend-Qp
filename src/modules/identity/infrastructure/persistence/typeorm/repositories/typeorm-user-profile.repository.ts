import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  CreateUserProfileInput,
  UserProfileRecord,
  UserProfileRepository,
} from '../../../../domain/repositories/user-profile.repository';
import { UserProfileOrmEntity } from '../entities/user-profile.orm-entity';

@Injectable()
export class TypeOrmUserProfileRepository implements UserProfileRepository {
  constructor(
    @InjectRepository(UserProfileOrmEntity)
    private readonly repository: Repository<UserProfileOrmEntity>,
  ) {}

  async create(
    input: CreateUserProfileInput,
    manager?: EntityManager,
  ): Promise<UserProfileRecord> {
    const repository = this.getRepository(manager);
    const entity = await repository.save(
      repository.create({
        userId: input.userId,
        fullName: input.fullName,
      }),
    );

    return this.toRecord(entity);
  }

  async findByUserId(userId: string): Promise<UserProfileRecord | null> {
    const entity = await this.repository.findOne({ where: { userId } });
    return entity ? this.toRecord(entity) : null;
  }

  private getRepository(
    manager?: EntityManager,
  ): Repository<UserProfileOrmEntity> {
    return manager ? manager.getRepository(UserProfileOrmEntity) : this.repository;
  }

  private toRecord(entity: UserProfileOrmEntity): UserProfileRecord {
    return {
      userId: entity.userId,
      fullName: entity.fullName,
      locationId: entity.locationId,
      avatarUrl: entity.avatarUrl,
    };
  }
}

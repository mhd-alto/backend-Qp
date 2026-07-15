import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  CreateUserInput,
  UserRecord,
  UserRepository,
} from '../../../../domain/repositories/user.repository';
import { UserOrmEntity } from '../entities/user.orm-entity';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repository: Repository<UserOrmEntity>,
  ) {}

  async findActiveByIdentifier(input: {
    email?: string | null;
    phone?: string | null;
  }): Promise<UserRecord | null> {
    if (!input.email && !input.phone) {
      return null;
    }

    const query = this.repository
      .createQueryBuilder('user')
      .where('user.deleted_at IS NULL');

    if (input.email && input.phone) {
      query.andWhere('(user.email = :email OR user.phone = :phone)', {
        email: input.email,
        phone: input.phone,
      });
    } else if (input.email) {
      query.andWhere('user.email = :email', { email: input.email });
    } else if (input.phone) {
      query.andWhere('user.phone = :phone', { phone: input.phone });
    }

    const entity = await query.getOne();
    return entity ? this.toRecord(entity) : null;
  }

  async create(
    input: CreateUserInput,
    manager?: EntityManager,
  ): Promise<UserRecord> {
    const repository = this.getRepository(manager);
    const entity = await repository.save(
      repository.create({
        email: input.email,
        phone: input.phone,
        passwordHash: input.passwordHash,
        platformRole: input.platformRole,
        status: input.status,
      }),
    );

    return this.toRecord(entity);
  }

  async findById(userId: string): Promise<UserRecord | null> {
    const entity = await this.repository.findOne({
      where: {
        id: userId,
      },
    });

    if (!entity || entity.deletedAt) {
      return null;
    }

    return this.toRecord(entity);
  }

  async updateLastLoginAt(
    userId: string,
    lastLoginAt: Date,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = this.getRepository(manager);
    await repository.update(userId, { lastLoginAt });
  }

  async updatePasswordHash(
    userId: string,
    passwordHash: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = this.getRepository(manager);
    await repository.update(userId, { passwordHash });
  }

  async updateStatus(
    userId: string,
    status: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = this.getRepository(manager);
    await repository.update(userId, { status });
  }

  private getRepository(manager?: EntityManager): Repository<UserOrmEntity> {
    return manager ? manager.getRepository(UserOrmEntity) : this.repository;
  }

  private toRecord(entity: UserOrmEntity): UserRecord {
    return {
      id: entity.id,
      email: entity.email,
      phone: entity.phone,
      passwordHash: entity.passwordHash,
      platformRole: entity.platformRole,
      status: entity.status,
      lastLoginAt: entity.lastLoginAt,
      deletedAt: entity.deletedAt,
    };
  }
}

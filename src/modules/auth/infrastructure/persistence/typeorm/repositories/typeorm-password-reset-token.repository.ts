import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  CreatePasswordResetTokenInput,
  PasswordResetTokenRecord,
  PasswordResetTokenRepository,
} from '../../../../domain/repositories/password-reset-token.repository';
import { PasswordResetTokenOrmEntity } from '../entities/password-reset-token.orm-entity';

@Injectable()
export class TypeOrmPasswordResetTokenRepository
  implements PasswordResetTokenRepository
{
  constructor(
    @InjectRepository(PasswordResetTokenOrmEntity)
    private readonly repository: Repository<PasswordResetTokenOrmEntity>,
  ) {}

  async create(
    input: CreatePasswordResetTokenInput,
    manager?: EntityManager,
  ): Promise<PasswordResetTokenRecord> {
    const repository = this.getRepository(manager);
    const entity = await repository.save(
      repository.create({
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      }),
    );

    return this.toRecord(entity);
  }

  async findActiveByTokenHash(
    tokenHash: string,
  ): Promise<PasswordResetTokenRecord | null> {
    const entity = await this.repository
      .createQueryBuilder('reset')
      .where('reset.token_hash = :tokenHash', { tokenHash })
      .andWhere('reset.used_at IS NULL')
      .getOne();

    return entity ? this.toRecord(entity) : null;
  }

  async markUsed(
    tokenId: string,
    usedAt: Date,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = this.getRepository(manager);
    await repository.update(tokenId, { usedAt });
  }

  private getRepository(
    manager?: EntityManager,
  ): Repository<PasswordResetTokenOrmEntity> {
    return manager
      ? manager.getRepository(PasswordResetTokenOrmEntity)
      : this.repository;
  }

  private toRecord(entity: PasswordResetTokenOrmEntity): PasswordResetTokenRecord {
    return {
      id: entity.id,
      userId: entity.userId,
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt,
      usedAt: entity.usedAt,
      createdAt: entity.createdAt,
    };
  }
}

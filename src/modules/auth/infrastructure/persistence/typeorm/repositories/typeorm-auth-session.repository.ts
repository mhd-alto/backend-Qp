import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  AuthSessionRecord,
  AuthSessionRepository,
  CreateAuthSessionInput,
  UpdateAuthSessionInput,
} from '../../../../domain/repositories/auth-session.repository';
import { AuthSessionOrmEntity } from '../entities/auth-session.orm-entity';

@Injectable()
export class TypeOrmAuthSessionRepository implements AuthSessionRepository {
  constructor(
    @InjectRepository(AuthSessionOrmEntity)
    private readonly repository: Repository<AuthSessionOrmEntity>,
  ) {}

  async create(
    input: CreateAuthSessionInput,
    manager?: EntityManager,
  ): Promise<AuthSessionRecord> {
    const repository = this.getRepository(manager);
    const entity = await repository.save(
      repository.create({
        id: input.id,
        userId: input.userId,
        refreshTokenHash: input.refreshTokenHash,
        userAgent: input.userAgent,
        ipHash: input.ipHash,
        expiresAt: input.expiresAt,
        lastUsedAt: input.lastUsedAt,
      }),
    );

    return this.toRecord(entity);
  }

  async update(
    input: UpdateAuthSessionInput,
    manager?: EntityManager,
  ): Promise<AuthSessionRecord> {
    const repository = this.getRepository(manager);
    await repository.update(input.id, {
      refreshTokenHash: input.refreshTokenHash,
      expiresAt: input.expiresAt,
      lastUsedAt: input.lastUsedAt,
    });

    const entity = await repository.findOneByOrFail({ id: input.id });
    return this.toRecord(entity);
  }

  async findActiveById(sessionId: string): Promise<AuthSessionRecord | null> {
    const entity = await this.repository
      .createQueryBuilder('session')
      .where('session.id = :sessionId', { sessionId })
      .andWhere('session.revoked_at IS NULL')
      .getOne();

    return entity ? this.toRecord(entity) : null;
  }

  async revokeById(
    sessionId: string,
    reason: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = this.getRepository(manager);
    await repository.update(
      { id: sessionId },
      { revokedAt: new Date(), revocationReason: reason },
    );
  }

  async revokeAllByUserId(
    userId: string,
    reason: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = this.getRepository(manager);
    await repository
      .createQueryBuilder()
      .update(AuthSessionOrmEntity)
      .set({
        revokedAt: new Date(),
        revocationReason: reason,
      })
      .where('user_id = :userId', { userId })
      .andWhere('revoked_at IS NULL')
      .execute();
  }

  private getRepository(manager?: EntityManager): Repository<AuthSessionOrmEntity> {
    return manager ? manager.getRepository(AuthSessionOrmEntity) : this.repository;
  }

  private toRecord(entity: AuthSessionOrmEntity): AuthSessionRecord {
    return {
      id: entity.id,
      userId: entity.userId,
      refreshTokenHash: entity.refreshTokenHash,
      userAgent: entity.userAgent,
      ipHash: entity.ipHash,
      expiresAt: entity.expiresAt,
      lastUsedAt: entity.lastUsedAt,
      revokedAt: entity.revokedAt,
      revocationReason: entity.revocationReason,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  CreateUserConsentInput,
  UserConsentRepository,
} from '../../../../domain/repositories/user-consent.repository';
import { UserConsentOrmEntity } from '../entities/user-consent.orm-entity';

@Injectable()
export class TypeOrmUserConsentRepository implements UserConsentRepository {
  constructor(
    @InjectRepository(UserConsentOrmEntity)
    private readonly repository: Repository<UserConsentOrmEntity>,
  ) {}

  async createMany(
    input: CreateUserConsentInput[],
    manager?: EntityManager,
  ): Promise<void> {
    const repository = this.getRepository(manager);
    await repository.save(
      input.map((item) =>
        repository.create({
          userId: item.userId,
          consentType: item.consentType,
          status: item.status,
          policyVersion: item.policyVersion,
          grantedAt: item.grantedAt,
          revokedAt: item.revokedAt ?? null,
        }),
      ),
    );
  }

  private getRepository(
    manager?: EntityManager,
  ): Repository<UserConsentOrmEntity> {
    return manager ? manager.getRepository(UserConsentOrmEntity) : this.repository;
  }
}

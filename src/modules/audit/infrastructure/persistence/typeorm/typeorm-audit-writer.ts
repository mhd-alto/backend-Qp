import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import {
  AuditWriter,
  WriteAuditLogInput,
} from '../../../contracts/audit-writer';
import { AuditLogOrmEntity } from './entities/audit-log.orm-entity';

@Injectable()
export class TypeOrmAuditWriter implements AuditWriter {
  constructor(
    @InjectRepository(AuditLogOrmEntity)
    private readonly repository: Repository<AuditLogOrmEntity>,
  ) {}

  async write(input: WriteAuditLogInput, manager?: EntityManager): Promise<void> {
    const logData = {
      actorUserId: input.actorUserId,
      businessId: input.businessId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ?? {},
    };

    if (manager) {
      await manager.save(
        manager.create(AuditLogOrmEntity, logData),
      );
    } else {
      await this.repository.save(
        this.repository.create(logData),
      );
    }
  }
}

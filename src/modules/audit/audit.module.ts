import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AUDIT_WRITER } from './contracts/audit.tokens';
import { AuditLogOrmEntity } from './infrastructure/persistence/typeorm/entities/audit-log.orm-entity';
import { TypeOrmAuditWriter } from './infrastructure/persistence/typeorm/typeorm-audit-writer';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogOrmEntity])],
  providers: [
    TypeOrmAuditWriter,
    {
      provide: AUDIT_WRITER,
      useExisting: TypeOrmAuditWriter,
    },
  ],
  exports: [AUDIT_WRITER],
})
export class AuditModule {}

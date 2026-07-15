import { EntityManager } from 'typeorm';

export type WriteAuditLogInput = {
  actorUserId: string | null;
  businessId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata?: Record<string, unknown>;
};

export interface AuditWriter {
  write(input: WriteAuditLogInput, manager?: EntityManager): Promise<void>;
}

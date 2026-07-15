export type AuditLog = {
  id: string;
  actorUserId: string | null;
  businessId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
};

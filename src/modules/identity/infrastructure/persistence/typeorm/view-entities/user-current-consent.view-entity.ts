import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  name: 'user_current_consents',
  expression: 'SELECT * FROM user_current_consents',
  synchronize: false,
})
export class UserCurrentConsentViewEntity {
  @ViewColumn({ name: 'id' })
  id!: string;

  @ViewColumn({ name: 'user_id' })
  userId!: string;

  @ViewColumn({ name: 'consent_type' })
  consentType!: string;

  @ViewColumn({ name: 'status' })
  status!: string;

  @ViewColumn({ name: 'policy_version' })
  policyVersion!: string;

  @ViewColumn({ name: 'granted_at' })
  grantedAt!: Date | null;

  @ViewColumn({ name: 'revoked_at' })
  revokedAt!: Date | null;

  @ViewColumn({ name: 'created_at' })
  createdAt!: Date;
}

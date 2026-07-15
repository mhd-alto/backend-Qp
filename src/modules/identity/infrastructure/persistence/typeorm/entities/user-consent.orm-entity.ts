import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'user_consents', synchronize: false })
export class UserConsentOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'consent_type', type: 'varchar', length: 30 })
  consentType!: string;

  @Column({ type: 'varchar', length: 20 })
  status!: string;

  @Column({ name: 'policy_version', type: 'varchar', length: 30 })
  policyVersion!: string;

  @Column({ name: 'granted_at', type: 'timestamptz', nullable: true })
  grantedAt!: Date | null;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

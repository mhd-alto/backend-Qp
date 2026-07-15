import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'coupon_validation_attempts', synchronize: false })
export class CouponValidationAttemptOrmEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'business_id', type: 'uuid' })
  businessId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'staff_membership_id', type: 'uuid' })
  staffMembershipId!: string;

  @Column({ name: 'coupon_id', type: 'uuid', nullable: true })
  couponId!: string | null;

  @Column({ name: 'input_fingerprint', type: 'char', length: 64, nullable: true })
  inputFingerprint!: string | null;

  @Column({ type: 'varchar', length: 20 })
  result!: string;

  @Column({ name: 'failure_reason', type: 'varchar', length: 40, nullable: true })
  failureReason!: string | null;

  @CreateDateColumn({ name: 'attempted_at', type: 'timestamptz' })
  attemptedAt!: Date;
}

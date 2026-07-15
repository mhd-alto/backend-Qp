import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRedemptions0090000000000009
  implements MigrationInterface
{
  name = 'CreateRedemptions0090000000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE redemptions (
        id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        coupon_id                  uuid NOT NULL,
        campaign_id                uuid NOT NULL,
        business_id                uuid NOT NULL,
        branch_id                  uuid NOT NULL,
        redeemed_by_membership_id  uuid NOT NULL,
        invoice_amount             numeric(18,2) NULL,
        discount_amount            numeric(18,2) NULL,
        currency                   char(3) NULL,
        status                     varchar(20) NOT NULL DEFAULT 'CONFIRMED',
        redeemed_at                timestamptz NOT NULL DEFAULT now(),
        reversed_at                timestamptz NULL,
        reversed_by_user_id        uuid NULL,
        reversal_reason            text NULL,
        created_at                 timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT redemptions_coupon_uq UNIQUE (coupon_id),

        CONSTRAINT redemptions_coupon_campaign_fk
          FOREIGN KEY (coupon_id, campaign_id)
          REFERENCES coupons(id, campaign_id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT redemptions_campaign_business_fk
          FOREIGN KEY (campaign_id, business_id)
          REFERENCES campaigns(id, business_id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT redemptions_branch_business_fk
          FOREIGN KEY (branch_id, business_id)
          REFERENCES branches(id, business_id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT redemptions_membership_business_fk
          FOREIGN KEY (redeemed_by_membership_id, business_id)
          REFERENCES business_memberships(id, business_id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT redemptions_reversed_by_user_fk
          FOREIGN KEY (reversed_by_user_id) REFERENCES users(id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT redemptions_status_ck
          CHECK (status IN ('CONFIRMED', 'REVERSED')),

        CONSTRAINT redemptions_invoice_amount_ck
          CHECK (invoice_amount IS NULL OR invoice_amount >= 0),

        CONSTRAINT redemptions_discount_amount_ck
          CHECK (discount_amount IS NULL OR discount_amount >= 0),

        CONSTRAINT redemptions_currency_ck
          CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$'),

        CONSTRAINT redemptions_reversal_ck
          CHECK (
            status <> 'REVERSED'
            OR (
              reversed_at IS NOT NULL
              AND reversed_by_user_id IS NOT NULL
              AND reversal_reason IS NOT NULL
              AND btrim(reversal_reason) <> ''
            )
          )
      );

      CREATE INDEX redemptions_campaign_time_idx
        ON redemptions(campaign_id, redeemed_at);

      CREATE INDEX redemptions_business_time_idx
        ON redemptions(business_id, redeemed_at);

      CREATE INDEX redemptions_branch_time_idx
        ON redemptions(branch_id, redeemed_at);

      CREATE INDEX redemptions_business_coupon_time_idx
        ON redemptions(business_id, coupon_id, redeemed_at);

      CREATE TABLE coupon_validation_attempts (
        id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        business_id           uuid NOT NULL,
        branch_id             uuid NOT NULL,
        staff_membership_id   uuid NOT NULL,
        coupon_id             uuid NULL,
        input_fingerprint     char(64) NULL,
        result                varchar(20) NOT NULL,
        failure_reason        varchar(40) NULL,
        attempted_at          timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT coupon_validation_attempts_business_fk
          FOREIGN KEY (business_id) REFERENCES businesses(id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT coupon_validation_attempts_branch_business_fk
          FOREIGN KEY (branch_id, business_id)
          REFERENCES branches(id, business_id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT coupon_validation_attempts_membership_business_fk
          FOREIGN KEY (staff_membership_id, business_id)
          REFERENCES business_memberships(id, business_id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT coupon_validation_attempts_coupon_fk
          FOREIGN KEY (coupon_id) REFERENCES coupons(id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT coupon_validation_attempts_result_ck
          CHECK (result IN ('VALID', 'INVALID')),

        CONSTRAINT coupon_validation_attempts_failure_reason_ck
          CHECK (
            failure_reason IS NULL
            OR failure_reason IN (
              'NOT_FOUND',
              'WRONG_BUSINESS',
              'ALREADY_REDEEMED',
              'EXPIRED',
              'CANCELLED',
              'SUSPENDED',
              'CAMPAIGN_INACTIVE',
              'BRANCH_NOT_ALLOWED',
              'NOT_ELIGIBLE',
              'LIMIT_REACHED'
            )
          ),

        CONSTRAINT coupon_validation_attempts_result_reason_ck
          CHECK (
            (result = 'VALID' AND failure_reason IS NULL)
            OR
            (result = 'INVALID' AND failure_reason IS NOT NULL)
          ),

        CONSTRAINT coupon_validation_attempts_fingerprint_ck
          CHECK (
            input_fingerprint IS NULL
            OR input_fingerprint ~ '^[0-9A-Fa-f]{64}$'
          )
      );

      CREATE INDEX coupon_validation_attempts_business_time_idx
        ON coupon_validation_attempts(business_id, attempted_at);

      CREATE INDEX coupon_validation_attempts_coupon_time_idx
        ON coupon_validation_attempts(coupon_id, attempted_at)
        WHERE coupon_id IS NOT NULL;

      CREATE INDEX coupon_validation_attempts_staff_time_idx
        ON coupon_validation_attempts(staff_membership_id, attempted_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS coupon_validation_attempts;
      DROP TABLE IF EXISTS redemptions;
    `);
  }
}

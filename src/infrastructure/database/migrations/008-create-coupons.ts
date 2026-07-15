import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoupons0080000000000008 implements MigrationInterface {
  name = 'CreateCoupons0080000000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE coupons (
        id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id          uuid NOT NULL,
        user_id              uuid NOT NULL,
        source_id            uuid NOT NULL,
        code                 varchar(20) NOT NULL,
        qr_token             uuid NOT NULL DEFAULT gen_random_uuid(),
        status               varchar(20) NOT NULL DEFAULT 'AVAILABLE',
        issued_at            timestamptz NOT NULL DEFAULT now(),
        expires_at           timestamptz NOT NULL,
        cancelled_at         timestamptz NULL,
        cancellation_reason  text NULL,
        created_at           timestamptz NOT NULL DEFAULT now(),
        updated_at           timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT coupons_code_uq UNIQUE (code),
        CONSTRAINT coupons_qr_token_uq UNIQUE (qr_token),
        CONSTRAINT coupons_campaign_user_uq UNIQUE (campaign_id, user_id),
        CONSTRAINT coupons_id_campaign_uq UNIQUE (id, campaign_id),

        CONSTRAINT coupons_campaign_fk
          FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT coupons_user_fk
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT coupons_source_campaign_fk
          FOREIGN KEY (source_id, campaign_id)
          REFERENCES campaign_sources(id, campaign_id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT coupons_expiration_ck
          CHECK (expires_at > issued_at),

        CONSTRAINT coupons_status_ck
          CHECK (status IN (
            'AVAILABLE',
            'REDEEMED',
            'EXPIRED',
            'CANCELLED',
            'SUSPENDED'
          )),

        CONSTRAINT coupons_cancellation_ck
          CHECK (
            status <> 'CANCELLED'
            OR (
              cancelled_at IS NOT NULL
              AND cancellation_reason IS NOT NULL
              AND btrim(cancellation_reason) <> ''
            )
          ),

        CONSTRAINT coupons_code_not_blank_ck
          CHECK (btrim(code) <> '')
      );

      CREATE INDEX coupons_user_status_idx
        ON coupons(user_id, status);

      CREATE INDEX coupons_campaign_status_idx
        ON coupons(campaign_id, status);

      CREATE INDEX coupons_expiration_idx
        ON coupons(expires_at)
        WHERE status = 'AVAILABLE';

      CREATE INDEX coupons_campaign_source_idx
        ON coupons(campaign_id, source_id, issued_at);

      CREATE TRIGGER coupons_set_updated_at
      BEFORE UPDATE ON coupons
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS coupons_set_updated_at ON coupons;
      DROP TABLE IF EXISTS coupons;
    `);
  }
}

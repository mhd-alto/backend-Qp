import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuth0040000000000004 implements MigrationInterface {
  name = 'CreateAuth0040000000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE auth_sessions (
        id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id             uuid NOT NULL,
        refresh_token_hash  varchar(255) NOT NULL,
        user_agent          text NULL,
        ip_hash             char(64) NULL,
        expires_at          timestamptz NOT NULL,
        last_used_at        timestamptz NULL,
        revoked_at          timestamptz NULL,
        revocation_reason   varchar(100) NULL,
        created_at          timestamptz NOT NULL DEFAULT now(),
        updated_at          timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT auth_sessions_user_fk
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT auth_sessions_refresh_hash_uq UNIQUE (refresh_token_hash),

        CONSTRAINT auth_sessions_expiry_ck
          CHECK (expires_at > created_at),

        CONSTRAINT auth_sessions_ip_hash_ck
          CHECK (ip_hash IS NULL OR ip_hash ~ '^[0-9A-Fa-f]{64}$'),

        CONSTRAINT auth_sessions_revocation_ck
          CHECK (
            (revoked_at IS NULL AND revocation_reason IS NULL)
            OR
            (revoked_at IS NOT NULL AND revocation_reason IS NOT NULL)
          )
      );

      CREATE INDEX auth_sessions_user_active_idx
        ON auth_sessions(user_id, expires_at)
        WHERE revoked_at IS NULL;

      CREATE INDEX auth_sessions_expiry_idx ON auth_sessions(expires_at);

      CREATE TRIGGER auth_sessions_set_updated_at
      BEFORE UPDATE ON auth_sessions
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE TABLE password_reset_tokens (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     uuid NOT NULL,
        token_hash  varchar(255) NOT NULL,
        expires_at  timestamptz NOT NULL,
        used_at     timestamptz NULL,
        created_at  timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT password_reset_tokens_user_fk
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT password_reset_tokens_hash_uq UNIQUE (token_hash),

        CONSTRAINT password_reset_tokens_expiry_ck
          CHECK (expires_at > created_at),

        CONSTRAINT password_reset_tokens_used_at_ck
          CHECK (used_at IS NULL OR used_at >= created_at)
      );

      CREATE INDEX password_reset_tokens_user_active_idx
        ON password_reset_tokens(user_id, expires_at)
        WHERE used_at IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS password_reset_tokens;
      DROP TRIGGER IF EXISTS auth_sessions_set_updated_at ON auth_sessions;
      DROP TABLE IF EXISTS auth_sessions;
    `);
  }
}

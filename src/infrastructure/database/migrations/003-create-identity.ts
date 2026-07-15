import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIdentity0030000000000003 implements MigrationInterface {
  name = 'CreateIdentity0030000000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email              citext NULL,
        phone              varchar(20) NULL,
        password_hash      varchar(255) NOT NULL,
        platform_role      varchar(20) NOT NULL DEFAULT 'USER',
        status             varchar(30) NOT NULL DEFAULT 'ACTIVE',
        email_verified_at  timestamptz NULL,
        phone_verified_at  timestamptz NULL,
        last_login_at      timestamptz NULL,
        created_at         timestamptz NOT NULL DEFAULT now(),
        updated_at         timestamptz NOT NULL DEFAULT now(),
        deleted_at         timestamptz NULL,

        CONSTRAINT users_identifier_required_ck
          CHECK (email IS NOT NULL OR phone IS NOT NULL),

        CONSTRAINT users_platform_role_ck
          CHECK (platform_role IN ('USER', 'ADMIN')),

        CONSTRAINT users_status_ck
          CHECK (status IN (
            'PENDING_VERIFICATION',
            'ACTIVE',
            'SUSPENDED',
            'DELETED'
          )),

        CONSTRAINT users_email_not_blank_ck
          CHECK (email IS NULL OR btrim(email::text) <> ''),

        CONSTRAINT users_phone_not_blank_ck
          CHECK (phone IS NULL OR btrim(phone) <> ''),

        CONSTRAINT users_password_hash_not_blank_ck
          CHECK (btrim(password_hash) <> '')
      );

      CREATE UNIQUE INDEX users_email_active_uq
        ON users(email)
        WHERE email IS NOT NULL AND deleted_at IS NULL;

      CREATE UNIQUE INDEX users_phone_active_uq
        ON users(phone)
        WHERE phone IS NOT NULL AND deleted_at IS NULL;

      CREATE INDEX users_status_idx ON users(status);
      CREATE INDEX users_platform_role_idx ON users(platform_role);

      CREATE TRIGGER users_set_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE TABLE user_profiles (
        user_id      uuid PRIMARY KEY,
        full_name    varchar(120) NOT NULL,
        location_id  uuid NULL,
        avatar_url   text NULL,
        created_at   timestamptz NOT NULL DEFAULT now(),
        updated_at   timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT user_profiles_user_fk
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT user_profiles_location_fk
          FOREIGN KEY (location_id) REFERENCES locations(id)
          ON UPDATE RESTRICT ON DELETE SET NULL,

        CONSTRAINT user_profiles_full_name_not_blank_ck
          CHECK (btrim(full_name) <> '')
      );

      CREATE INDEX user_profiles_location_idx ON user_profiles(location_id);

      CREATE TRIGGER user_profiles_set_updated_at
      BEFORE UPDATE ON user_profiles
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE TABLE user_consents (
        id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         uuid NOT NULL,
        consent_type    varchar(30) NOT NULL,
        status          varchar(20) NOT NULL,
        policy_version  varchar(30) NOT NULL,
        granted_at      timestamptz NULL,
        revoked_at      timestamptz NULL,
        created_at      timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT user_consents_user_fk
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT user_consents_type_ck
          CHECK (consent_type IN (
            'TERMS',
            'PRIVACY',
            'MARKETING',
            'PERSONALIZATION'
          )),

        CONSTRAINT user_consents_status_ck
          CHECK (status IN ('GRANTED', 'REVOKED')),

        CONSTRAINT user_consents_timestamp_ck
          CHECK (
            (
              status = 'GRANTED'
              AND granted_at IS NOT NULL
              AND revoked_at IS NULL
            )
            OR
            (
              status = 'REVOKED'
              AND revoked_at IS NOT NULL
              AND granted_at IS NULL
            )
          ),

        CONSTRAINT user_consents_policy_version_not_blank_ck
          CHECK (btrim(policy_version) <> '')
      );

      CREATE INDEX user_consents_user_type_created_idx
        ON user_consents(user_id, consent_type, created_at DESC);

      CREATE VIEW user_current_consents AS
      SELECT DISTINCT ON (user_id, consent_type)
        id,
        user_id,
        consent_type,
        status,
        policy_version,
        granted_at,
        revoked_at,
        created_at
      FROM user_consents
      ORDER BY user_id, consent_type, created_at DESC, id DESC;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP VIEW IF EXISTS user_current_consents;
      DROP TABLE IF EXISTS user_consents;
      DROP TRIGGER IF EXISTS user_profiles_set_updated_at ON user_profiles;
      DROP TABLE IF EXISTS user_profiles;
      DROP TRIGGER IF EXISTS users_set_updated_at ON users;
      DROP TABLE IF EXISTS users;
    `);
  }
}

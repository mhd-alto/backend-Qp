import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAudit0100000000000010 implements MigrationInterface {
  name = 'CreateAudit0100000000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE audit_logs (
        id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        actor_user_id  uuid NULL,
        business_id    uuid NULL,
        action         varchar(80) NOT NULL,
        entity_type    varchar(50) NOT NULL,
        entity_id      uuid NULL,
        metadata       jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at     timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT audit_logs_actor_user_fk
          FOREIGN KEY (actor_user_id) REFERENCES users(id)
          ON UPDATE RESTRICT ON DELETE SET NULL,

        CONSTRAINT audit_logs_business_fk
          FOREIGN KEY (business_id) REFERENCES businesses(id)
          ON UPDATE RESTRICT ON DELETE SET NULL,

        CONSTRAINT audit_logs_action_not_blank_ck
          CHECK (btrim(action) <> ''),

        CONSTRAINT audit_logs_entity_type_not_blank_ck
          CHECK (btrim(entity_type) <> ''),

        CONSTRAINT audit_logs_metadata_object_ck
          CHECK (jsonb_typeof(metadata) = 'object')
      );

      CREATE INDEX audit_logs_actor_time_idx
        ON audit_logs(actor_user_id, created_at)
        WHERE actor_user_id IS NOT NULL;

      CREATE INDEX audit_logs_business_time_idx
        ON audit_logs(business_id, created_at)
        WHERE business_id IS NOT NULL;

      CREATE INDEX audit_logs_entity_idx
        ON audit_logs(entity_type, entity_id, created_at);

      CREATE INDEX audit_logs_action_time_idx
        ON audit_logs(action, created_at);

      CREATE INDEX audit_logs_metadata_gin_idx
        ON audit_logs USING gin (metadata);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs;`);
  }
}

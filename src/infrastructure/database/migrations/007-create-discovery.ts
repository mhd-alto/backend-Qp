import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDiscovery0070000000000007 implements MigrationInterface {
  name = 'CreateDiscovery0070000000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE campaign_visits (
        id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        campaign_id   uuid NOT NULL,
        source_id     uuid NOT NULL,
        user_id       uuid NULL,
        visitor_hash  char(64) NULL,
        visited_at    timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT campaign_visits_campaign_fk
          FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT campaign_visits_source_campaign_fk
          FOREIGN KEY (source_id, campaign_id)
          REFERENCES campaign_sources(id, campaign_id)
          ON UPDATE RESTRICT ON DELETE RESTRICT,

        CONSTRAINT campaign_visits_user_fk
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON UPDATE RESTRICT ON DELETE SET NULL,

        CONSTRAINT campaign_visits_hash_ck
          CHECK (visitor_hash IS NULL OR visitor_hash ~ '^[0-9A-Fa-f]{64}$')
      );

      CREATE INDEX campaign_visits_campaign_time_idx
        ON campaign_visits(campaign_id, visited_at);

      CREATE INDEX campaign_visits_source_time_idx
        ON campaign_visits(source_id, visited_at);

      CREATE INDEX campaign_visits_user_time_idx
        ON campaign_visits(user_id, visited_at)
        WHERE user_id IS NOT NULL;

      CREATE INDEX campaign_visits_visitor_hash_time_idx
        ON campaign_visits(visitor_hash, visited_at)
        WHERE visitor_hash IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS campaign_visits;`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnablePostgresExtensions0010000000000001
  implements MigrationInterface
{
  name = 'EnablePostgresExtensions0010000000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
      CREATE EXTENSION IF NOT EXISTS citext;
      CREATE EXTENSION IF NOT EXISTS pg_trgm;

      SET TIME ZONE 'UTC';

      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
        NEW.updated_at := now();
        RETURN NEW;
      END;
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS set_updated_at();
      DROP EXTENSION IF EXISTS pg_trgm;
      DROP EXTENSION IF EXISTS citext;
      DROP EXTENSION IF EXISTS pgcrypto;
    `);
  }
}

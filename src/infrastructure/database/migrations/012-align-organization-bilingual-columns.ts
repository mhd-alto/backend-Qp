import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignOrganizationBilingualColumns0120000000000012
  implements MigrationInterface
{
  name = 'AlignOrganizationBilingualColumns0120000000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE businesses
        ADD COLUMN IF NOT EXISTS display_name_en varchar(180) NULL,
        ADD COLUMN IF NOT EXISTS description_en text NULL;

      ALTER TABLE branches
        ADD COLUMN IF NOT EXISTS name_en varchar(150) NULL,
        ADD COLUMN IF NOT EXISTS address_line_en text NULL;

      CREATE INDEX IF NOT EXISTS businesses_name_en_trgm_idx
        ON businesses USING gin (display_name_en gin_trgm_ops);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS businesses_name_en_trgm_idx;

      ALTER TABLE branches
        DROP COLUMN IF EXISTS address_line_en,
        DROP COLUMN IF EXISTS name_en;

      ALTER TABLE businesses
        DROP COLUMN IF EXISTS description_en,
        DROP COLUMN IF EXISTS display_name_en;
    `);
  }
}

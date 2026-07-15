import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignCampaignBilingualColumns0130000000000013
  implements MigrationInterface
{
  name = 'AlignCampaignBilingualColumns0130000000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE campaigns
        ADD COLUMN IF NOT EXISTS title_en varchar(180) NULL,
        ADD COLUMN IF NOT EXISTS description_en text NULL,
        ADD COLUMN IF NOT EXISTS terms_text_en text NULL;

      ALTER TABLE campaign_benefits
        ADD COLUMN IF NOT EXISTS description_en text NULL;

      ALTER TABLE campaign_sources
        ADD COLUMN IF NOT EXISTS label_en varchar(150) NULL;

      CREATE INDEX IF NOT EXISTS campaigns_title_en_trgm_idx
        ON campaigns USING gin (title_en gin_trgm_ops);

      CREATE INDEX IF NOT EXISTS campaigns_description_en_trgm_idx
        ON campaigns USING gin (description_en gin_trgm_ops);

      CREATE UNIQUE INDEX IF NOT EXISTS campaign_sources_campaign_label_en_uq
        ON campaign_sources(campaign_id, label_en)
        WHERE label_en IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS campaign_sources_campaign_label_en_uq;
      DROP INDEX IF EXISTS campaigns_description_en_trgm_idx;
      DROP INDEX IF EXISTS campaigns_title_en_trgm_idx;

      ALTER TABLE campaign_sources
        DROP COLUMN IF EXISTS label_en;

      ALTER TABLE campaign_benefits
        DROP COLUMN IF EXISTS description_en;

      ALTER TABLE campaigns
        DROP COLUMN IF EXISTS terms_text_en,
        DROP COLUMN IF EXISTS description_en,
        DROP COLUMN IF EXISTS title_en;
    `);
  }
}

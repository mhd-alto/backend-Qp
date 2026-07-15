import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRedemptionImpactFields0140000000000014
  implements MigrationInterface
{
  name = 'AddRedemptionImpactFields0140000000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE redemptions
        ADD COLUMN IF NOT EXISTS original_amount numeric(18,2) NULL,
        ADD COLUMN IF NOT EXISTS final_amount numeric(18,2) NULL,
        ADD COLUMN IF NOT EXISTS currency_code varchar(3) NOT NULL DEFAULT 'SYP';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE redemptions
        DROP COLUMN IF EXISTS original_amount,
        DROP COLUMN IF EXISTS final_amount,
        DROP COLUMN IF EXISTS currency_code;
    `);
  }
}

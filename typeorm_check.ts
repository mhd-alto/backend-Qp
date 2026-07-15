import { DataSource } from 'typeorm';
import { CampaignOrmEntity } from './src/modules/campaigns/infrastructure/persistence/typeorm/entities/campaign.orm-entity';
import { CampaignBenefitOrmEntity } from './src/modules/campaigns/infrastructure/persistence/typeorm/entities/campaign-benefit.orm-entity';
import { CategoryOrmEntity } from './src/modules/reference-data/infrastructure/persistence/typeorm/entities/category.orm-entity';
import { BranchOrmEntity } from './src/modules/organizations/infrastructure/persistence/typeorm/entities/branch.orm-entity';
import { BusinessOrmEntity } from './src/modules/organizations/infrastructure/persistence/typeorm/entities/business.orm-entity';
import { LocationOrmEntity } from './src/modules/reference-data/infrastructure/persistence/typeorm/entities/location.orm-entity';

async function main() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: '121420000',
    database: 'copoun',
    entities: [
      CampaignOrmEntity,
      CampaignBenefitOrmEntity,
      CategoryOrmEntity,
      BranchOrmEntity,
      BusinessOrmEntity,
      LocationOrmEntity
    ],
  });

  try {
    await dataSource.initialize();
    console.log('DataSource initialized');

    const campaigns = await dataSource.getRepository(CampaignOrmEntity)
      .createQueryBuilder('campaign')
      .innerJoinAndSelect(
        BusinessOrmEntity,
        'business',
        'business.id = campaign.business_id AND business.status = :activeStatus',
        { activeStatus: 'ACTIVE' },
      )
      .innerJoinAndSelect(
        CampaignBenefitOrmEntity,
        'benefit',
        'benefit.campaign_id = campaign.id',
      )
      .innerJoinAndSelect(
        CategoryOrmEntity,
        'category',
        'category.id = campaign.primary_category_id',
      )
      .leftJoinAndSelect(
        'campaign_branches',
        'cb',
        'cb.campaign_id = campaign.id',
      )
      .leftJoinAndMapMany(
        'campaign.branches',
        BranchOrmEntity,
        'branch',
        'branch.id = cb.branch_id AND branch.deleted_at IS NULL AND branch.status = :activeStatus',
        { activeStatus: 'ACTIVE' },
      )
      .where('campaign.status = :activeStatus', { activeStatus: 'ACTIVE' })
      .andWhere('campaign.is_searchable = true')
      .getRawMany();

    if (campaigns.length > 0) {
      console.log('Keys of first raw row:');
      console.log(Object.keys(campaigns[0]));
      console.log('\nValues of first raw row related to categories and branches:');
      const first = campaigns[0];
      const filtered: Record<string, any> = {};
      for (const key of Object.keys(first)) {
        if (key.includes('category') || key.includes('branch') || key.includes('description') || key.includes('title')) {
          filtered[key] = first[key];
        }
      }
      console.log(JSON.stringify(filtered, null, 2));
    } else {
      console.log('No active campaigns found');
    }

  } catch (err) {
    console.error(err);
  } finally {
    await dataSource.destroy();
  }
}

main();

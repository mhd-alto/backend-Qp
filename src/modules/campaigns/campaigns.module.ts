import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { IdentityModule } from '../identity/identity.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { ReferenceDataModule } from '../reference-data/reference-data.module';
import { AdminCampaignsController } from './api/admin-campaigns.controller';
import { BusinessCampaignsController } from './api/business-campaigns.controller';
import { BusinessCampaignSourcesController } from './api/business-campaign-sources.controller';
import { AdminCampaignsService } from './application/admin-campaigns.service';
import { BusinessCampaignsService } from './application/business-campaigns.service';
import { CampaignSourcesService } from './application/campaign-sources.service';
import { DemoCampaignsSeedService } from './application/seeds/demo-campaigns.seed';
import { CampaignAccessService } from './application/shared/campaign-access.service';
import { CampaignBenefitOrmEntity } from './infrastructure/persistence/typeorm/entities/campaign-benefit.orm-entity';
import { CampaignBranchOrmEntity } from './infrastructure/persistence/typeorm/entities/campaign-branch.orm-entity';
import { CampaignLimitOrmEntity } from './infrastructure/persistence/typeorm/entities/campaign-limit.orm-entity';
import { CampaignOrmEntity } from './infrastructure/persistence/typeorm/entities/campaign.orm-entity';
import { CampaignSourceOrmEntity } from './infrastructure/persistence/typeorm/entities/campaign-source.orm-entity';
import { CampaignReadRepository } from './infrastructure/persistence/typeorm/queries/campaign-read.repository';
import { BranchOrmEntity } from '../organizations/infrastructure/persistence/typeorm/entities/branch.orm-entity';
import { BusinessMembershipOrmEntity } from '../organizations/infrastructure/persistence/typeorm/entities/business-membership.orm-entity';
import { BusinessOrmEntity } from '../organizations/infrastructure/persistence/typeorm/entities/business.orm-entity';
import { UserOrmEntity } from '../identity/infrastructure/persistence/typeorm/entities/user.orm-entity';
import { CategoryOrmEntity } from '../reference-data/infrastructure/persistence/typeorm/entities/category.orm-entity';

@Module({
  imports: [
    AuthModule,
    IdentityModule,
    AuditModule,
    OrganizationsModule,
    ReferenceDataModule,
    TypeOrmModule.forFeature([
      CampaignOrmEntity,
      CampaignBenefitOrmEntity,
      CampaignLimitOrmEntity,
      CampaignBranchOrmEntity,
      CampaignSourceOrmEntity,
      BusinessOrmEntity,
      BusinessMembershipOrmEntity,
      BranchOrmEntity,
      CategoryOrmEntity,
      UserOrmEntity,
    ]),
  ],
  controllers: [
    BusinessCampaignsController,
    BusinessCampaignSourcesController,
    AdminCampaignsController,
  ],
  providers: [
    CampaignReadRepository,
    CampaignAccessService,
    BusinessCampaignsService,
    CampaignSourcesService,
    AdminCampaignsService,
    DemoCampaignsSeedService,
  ],
  exports: [
    BusinessCampaignsService,
  ],
})
export class CampaignsModule {}

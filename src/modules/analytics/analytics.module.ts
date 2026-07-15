import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { IdentityModule } from '../identity/identity.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { BusinessAnalyticsController } from './api/business-analytics.controller';
import { GetCampaignAnalyticsService } from './application/get-campaign-analytics/get-campaign-analytics.service';
import { GetCampaignSourceAnalyticsService } from './application/get-campaign-source-analytics/get-campaign-source-analytics.service';
import { CampaignPerformanceViewEntity } from './infrastructure/persistence/typeorm/view-entities/campaign-performance.view-entity';
import { CampaignSourcePerformanceViewEntity } from './infrastructure/persistence/typeorm/view-entities/campaign-source-performance.view-entity';
import { CampaignOrmEntity } from '../campaigns/infrastructure/persistence/typeorm/entities/campaign.orm-entity';

@Module({
  imports: [
    AuthModule,
    IdentityModule,
    OrganizationsModule,
    TypeOrmModule.forFeature([
      CampaignPerformanceViewEntity,
      CampaignSourcePerformanceViewEntity,
      CampaignOrmEntity,
    ]),
  ],
  controllers: [BusinessAnalyticsController],
  providers: [
    GetCampaignAnalyticsService,
    GetCampaignSourceAnalyticsService,
  ],
  exports: [
    GetCampaignAnalyticsService,
    GetCampaignSourceAnalyticsService,
  ],
})
export class AnalyticsModule {}

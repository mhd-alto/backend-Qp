import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/configuration';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './infrastructure/database/database.module';
import { LoggerModule } from './infrastructure/logging/logger.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { IdentityModule } from './modules/identity/identity.module';
import { ReferenceDataModule } from './modules/reference-data/reference-data.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { AuditModule } from './modules/audit/audit.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { RedemptionsModule } from './modules/redemptions/redemptions.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { MediaModule } from './modules/media/media.module';
import { ImpactModule } from './modules/impact/impact.module';
import { IntelligenceModule } from './modules/intelligence/intelligence.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
      load: configuration,
    }),
    DatabaseModule,
    LoggerModule,
    HealthModule,
    IdentityModule,
    AuthModule,
    AuditModule,
    ReferenceDataModule,
    OrganizationsModule,
    CampaignsModule,
    DiscoveryModule,
    CouponsModule,
    RedemptionsModule,
    AnalyticsModule,
    MediaModule,
    ImpactModule,
    IntelligenceModule,
  ],
})
export class AppModule {}

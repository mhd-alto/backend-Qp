import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { IdentityModule } from '../identity/identity.module';
import { CampaignSimulatorController } from './campaign-simulator/campaign-simulator.controller';
import { CampaignCopilotController } from './campaign-copilot/campaign-copilot.controller';
import { GeminiService } from './campaign-copilot/gemini.service';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { SmartOfferSearchController } from './smart-offer-search/smart-offer-search.controller';
import { SmartOfferSearchService } from './smart-offer-search/smart-offer-search.service';
import { CampaignOrmEntity } from '../campaigns/infrastructure/persistence/typeorm/entities/campaign.orm-entity';

@Module({
  imports: [
    AuthModule,
    IdentityModule,
    CampaignsModule,
    TypeOrmModule.forFeature([CampaignOrmEntity]),
  ],
  controllers: [
    CampaignSimulatorController,
    CampaignCopilotController,
    SmartOfferSearchController,
  ],
  providers: [
    GeminiService,
    SmartOfferSearchService,
  ],
})
export class IntelligenceModule {}

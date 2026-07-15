import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampaignPerformanceViewEntity } from '../analytics/infrastructure/persistence/typeorm/view-entities/campaign-performance.view-entity';
import { AuthModule } from '../auth/auth.module';
import { IdentityModule } from '../identity/identity.module';
import { BranchOrmEntity } from '../organizations/infrastructure/persistence/typeorm/entities/branch.orm-entity';
import { BusinessOrmEntity } from '../organizations/infrastructure/persistence/typeorm/entities/business.orm-entity';
import { CategoryOrmEntity } from '../reference-data/infrastructure/persistence/typeorm/entities/category.orm-entity';
import { CampaignBenefitOrmEntity } from '../campaigns/infrastructure/persistence/typeorm/entities/campaign-benefit.orm-entity';
import { CampaignBranchOrmEntity } from '../campaigns/infrastructure/persistence/typeorm/entities/campaign-branch.orm-entity';
import { CampaignLimitOrmEntity } from '../campaigns/infrastructure/persistence/typeorm/entities/campaign-limit.orm-entity';
import { CampaignOrmEntity } from '../campaigns/infrastructure/persistence/typeorm/entities/campaign.orm-entity';
import { CampaignSourceOrmEntity } from '../campaigns/infrastructure/persistence/typeorm/entities/campaign-source.orm-entity';
import { PublicOffersController } from './api/public-offers.controller';
import { OptionalJwtAuthGuard } from './api/guards/optional-jwt-auth.guard';
import { GetPublicOfferService } from './application/get-public-offer/get-public-offer.service';
import { ListPublicOffersService } from './application/list-public-offers/list-public-offers.service';
import { RecordCampaignVisitService } from './application/record-campaign-visit/record-campaign-visit.service';
import { ResolveAttributionContextService } from './application/resolve-attribution-context/resolve-attribution-context.service';
import { SearchPublicOffersService } from './application/search-public-offers/search-public-offers.service';
import { CampaignVisitOrmEntity } from './infrastructure/persistence/typeorm/entities/campaign-visit.orm-entity';
import { PublicOfferReadRepository } from './infrastructure/persistence/typeorm/public-offer.read-repository';
import { ATTRIBUTION_CONTEXT_READER } from './contracts/attribution-context-reader';

@Module({
  imports: [
    AuthModule,
    IdentityModule,
    TypeOrmModule.forFeature([
      CampaignOrmEntity,
      CampaignBenefitOrmEntity,
      CampaignLimitOrmEntity,
      CampaignBranchOrmEntity,
      CampaignSourceOrmEntity,
      CampaignVisitOrmEntity,
      BusinessOrmEntity,
      BranchOrmEntity,
      CategoryOrmEntity,
      CampaignPerformanceViewEntity,
    ]),
  ],
  controllers: [PublicOffersController],
  providers: [
    OptionalJwtAuthGuard,
    PublicOfferReadRepository,
    SearchPublicOffersService,
    ListPublicOffersService,
    GetPublicOfferService,
    ResolveAttributionContextService,
    RecordCampaignVisitService,
    {
      provide: ATTRIBUTION_CONTEXT_READER,
      useExisting: ResolveAttributionContextService,
    },
  ],
  exports: [ATTRIBUTION_CONTEXT_READER, ResolveAttributionContextService],
})
export class DiscoveryModule {}

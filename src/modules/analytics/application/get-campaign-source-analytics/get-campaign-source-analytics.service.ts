import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FRIENDLY_MESSAGES } from '../../../../common/constants/localized-messages';
import { AuthenticatedPrincipal } from '../../../../common/types/authenticated-principal';
import {
  BUSINESS_MEMBERSHIP_REPOSITORY,
  BusinessMembershipRepository,
} from '../../../organizations/domain/repositories/business-membership.repository';
import { CampaignOrmEntity } from '../../../campaigns/infrastructure/persistence/typeorm/entities/campaign.orm-entity';
import { CampaignSourcePerformanceViewEntity } from '../../infrastructure/persistence/typeorm/view-entities/campaign-source-performance.view-entity';
import { SourceAnalyticsResponseDto } from '../../api/dto/analytics.response';

@Injectable()
export class GetCampaignSourceAnalyticsService {
  constructor(
    @Inject(BUSINESS_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: BusinessMembershipRepository,
    @InjectRepository(CampaignOrmEntity)
    private readonly campaignRepository: Repository<CampaignOrmEntity>,
    @InjectRepository(CampaignSourcePerformanceViewEntity)
    private readonly sourcePerformanceRepository: Repository<CampaignSourcePerformanceViewEntity>,
  ) {}

  async execute(
    campaignId: string,
    actor: AuthenticatedPrincipal,
  ): Promise<SourceAnalyticsResponseDto[]> {
    // 1. Verify owner membership
    const membership = await this.membershipRepository.findActiveOwnerMembershipByUserId(actor.id);
    if (!membership) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: FRIENDLY_MESSAGES.FORBIDDEN,
      });
    }

    // 2. Verify campaign ownership
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, businessId: membership.businessId },
    });

    if (!campaign || campaign.deletedAt) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: FRIENDLY_MESSAGES.RESOURCE_NOT_FOUND,
      });
    }

    // 3. Query source-level performance
    const performances = await this.sourcePerformanceRepository.find({
      where: { campaignId },
    });

    return performances.map((p) => ({
      sourceId: p.sourceId,
      sourceType: p.sourceType,
      label: p.label,
      totalVisits: Number(p.totalVisits || 0),
      issuedCoupons: Number(p.issuedCoupons || 0),
      confirmedRedemptions: Number(p.confirmedRedemptions || 0),
      claimRatePercent: Number(p.claimRatePercent || 0),
      redemptionRatePercent: Number(p.redemptionRatePercent || 0),
    }));
  }
}

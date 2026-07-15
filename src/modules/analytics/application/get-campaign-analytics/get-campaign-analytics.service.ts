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
import { CampaignPerformanceViewEntity } from '../../infrastructure/persistence/typeorm/view-entities/campaign-performance.view-entity';
import { CampaignAnalyticsResponseDto } from '../../api/dto/analytics.response';

@Injectable()
export class GetCampaignAnalyticsService {
  constructor(
    @Inject(BUSINESS_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: BusinessMembershipRepository,
    @InjectRepository(CampaignOrmEntity)
    private readonly campaignRepository: Repository<CampaignOrmEntity>,
    @InjectRepository(CampaignPerformanceViewEntity)
    private readonly performanceRepository: Repository<CampaignPerformanceViewEntity>,
  ) {}

  async execute(
    campaignId: string,
    actor: AuthenticatedPrincipal,
  ): Promise<CampaignAnalyticsResponseDto> {
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

    // 3. Query performance
    const summary = await this.performanceRepository.findOne({
      where: { campaignId },
    });

    if (!summary) {
      return {
        campaignId,
        totalVisits: 0,
        knownUniqueUsers: 0,
        anonymousUniqueVisitors: 0,
        issuedCoupons: 0,
        confirmedRedemptions: 0,
        remainingQuota: 0,
        claimRatePercent: 0,
        redemptionRatePercent: 0,
      };
    }

    return {
      campaignId: summary.campaignId,
      totalVisits: Number(summary.totalVisits || 0),
      knownUniqueUsers: Number(summary.knownUniqueUsers || 0),
      anonymousUniqueVisitors: Number(summary.anonymousUniqueVisitors || 0),
      issuedCoupons: Number(summary.issuedCoupons || 0),
      confirmedRedemptions: Number(summary.confirmedRedemptions || 0),
      remainingQuota: Number(summary.remainingQuota || 0),
      claimRatePercent: Number(summary.claimRatePercent || 0),
      redemptionRatePercent: Number(summary.redemptionRatePercent || 0),
    };
  }
}

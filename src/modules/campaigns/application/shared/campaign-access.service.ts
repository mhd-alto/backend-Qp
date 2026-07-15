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
  BusinessMembershipRecord,
} from '../../../organizations/domain/repositories/business-membership.repository';
import {
  BUSINESS_REPOSITORY,
  BusinessRecord,
  BusinessRepository,
} from '../../../organizations/domain/repositories/business.repository';
import { CampaignOrmEntity } from '../../infrastructure/persistence/typeorm/entities/campaign.orm-entity';

@Injectable()
export class CampaignAccessService {
  constructor(
    @Inject(BUSINESS_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: BusinessMembershipRepository,
    @Inject(BUSINESS_REPOSITORY)
    private readonly businessRepository: BusinessRepository,
    @InjectRepository(CampaignOrmEntity)
    private readonly campaignRepository: Repository<CampaignOrmEntity>,
  ) {}

  async requireActiveOwner(actor: AuthenticatedPrincipal): Promise<{
    membership: BusinessMembershipRecord;
    business: BusinessRecord;
  }> {
    const membership =
      await this.membershipRepository.findActiveOwnerMembershipByUserId(actor.id);

    if (!membership) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: FRIENDLY_MESSAGES.FORBIDDEN,
      });
    }

    const business = await this.businessRepository.findById(membership.businessId);

    if (!business) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: FRIENDLY_MESSAGES.RESOURCE_NOT_FOUND,
      });
    }

    if (business.status !== 'ACTIVE') {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: {
          ar: 'هذا النشاط التجاري غير متاح حالياً.',
          en: 'This business is not available right now.',
        },
      });
    }

    return { membership, business };
  }

  async requireOwnedCampaign(
    actor: AuthenticatedPrincipal,
    campaignId: string,
  ): Promise<{
    membership: BusinessMembershipRecord;
    business: BusinessRecord;
    campaign: CampaignOrmEntity;
  }> {
    const context = await this.requireActiveOwner(actor);
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, businessId: context.business.id },
    });

    if (!campaign || campaign.deletedAt) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: FRIENDLY_MESSAGES.RESOURCE_NOT_FOUND,
      });
    }

    return { ...context, campaign };
  }

  async requireCampaign(campaignId: string): Promise<CampaignOrmEntity> {
    const campaign = await this.campaignRepository.findOne({ where: { id: campaignId } });

    if (!campaign || campaign.deletedAt) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: FRIENDLY_MESSAGES.RESOURCE_NOT_FOUND,
      });
    }

    return campaign;
  }
}

import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FRIENDLY_MESSAGES } from '../../../../common/constants/localized-messages';
import { AuthenticatedPrincipal } from '../../../../common/types/authenticated-principal';
import {
  BUSINESS_MEMBERSHIP_REPOSITORY,
  BusinessMembershipRepository,
} from '../../domain/repositories/business-membership.repository';
import {
  BUSINESS_REPOSITORY,
  BusinessRepository,
} from '../../domain/repositories/business.repository';
import { OrganizationReadRepository } from '../../infrastructure/persistence/typeorm/queries/organization-read.repository';

@Injectable()
export class GetBusinessProfileService {
  constructor(
    @Inject(BUSINESS_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: BusinessMembershipRepository,
    @Inject(BUSINESS_REPOSITORY)
    private readonly businessRepository: BusinessRepository,
    private readonly organizationReadRepository: OrganizationReadRepository,
  ) {}

  async execute(actor: AuthenticatedPrincipal) {
    const membership = await this.membershipRepository.findActiveOwnerMembershipByUserId(
      actor.id,
    );

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

    return this.organizationReadRepository.getBusinessDetails(business.id);
  }
}

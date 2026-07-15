import { Injectable, NotFoundException } from '@nestjs/common';
import { FRIENDLY_MESSAGES } from '../../../../common/constants/localized-messages';
import { OrganizationReadRepository } from '../../infrastructure/persistence/typeorm/queries/organization-read.repository';

@Injectable()
export class GetAdminBusinessService {
  constructor(
    private readonly organizationReadRepository: OrganizationReadRepository,
  ) {}

  async execute(businessId: string) {
    const business = await this.organizationReadRepository.getBusinessDetails(businessId);

    if (!business) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: FRIENDLY_MESSAGES.RESOURCE_NOT_FOUND,
      });
    }

    return business;
  }
}

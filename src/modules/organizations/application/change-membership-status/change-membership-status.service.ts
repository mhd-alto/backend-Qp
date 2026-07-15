import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FRIENDLY_MESSAGES } from '../../../../common/constants/localized-messages';
import { AuthenticatedPrincipal } from '../../../../common/types/authenticated-principal';
import { AUDIT_WRITER } from '../../../audit/contracts/audit.tokens';
import { AuditWriter } from '../../../audit/contracts/audit-writer';
import { MembershipStatusRequestDto } from '../../api/dto/membership-status.request';
import {
  BUSINESS_MEMBERSHIP_REPOSITORY,
  BusinessMembershipRepository,
} from '../../domain/repositories/business-membership.repository';
import { OrganizationReadRepository } from '../../infrastructure/persistence/typeorm/queries/organization-read.repository';

@Injectable()
export class ChangeMembershipStatusService {
  constructor(
    @Inject(BUSINESS_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: BusinessMembershipRepository,
    @Inject(AUDIT_WRITER)
    private readonly auditWriter: AuditWriter,
    private readonly organizationReadRepository: OrganizationReadRepository,
  ) {}

  async execute(
    businessId: string,
    membershipId: string,
    body: MembershipStatusRequestDto,
    actor: AuthenticatedPrincipal,
  ) {
    const membership = await this.membershipRepository.findByIdAndBusiness(
      businessId,
      membershipId,
    );

    if (!membership) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: FRIENDLY_MESSAGES.RESOURCE_NOT_FOUND,
      });
    }

    if (
      membership.role === 'OWNER' &&
      membership.status === 'ACTIVE' &&
      body.status !== 'ACTIVE'
    ) {
      const activeOwners = await this.membershipRepository.countActiveOwners(businessId);

      if (activeOwners <= 1) {
        throw new ConflictException({
          code: 'REQUEST_FAILED',
          message: {
            ar: 'لا يمكن تعطيل أو إزالة آخر مالك نشط لهذا النشاط التجاري.',
            en: 'The last active owner of this business cannot be suspended or removed.',
          },
        });
      }
    }

    await this.membershipRepository.updateStatus(membershipId, body.status);
    await this.auditWriter.write({
      actorUserId: actor.id,
      businessId,
      action: 'BUSINESS_MEMBERSHIP_STATUS_CHANGED',
      entityType: 'BUSINESS_MEMBERSHIP',
      entityId: membershipId,
      metadata: {
        status: body.status,
      },
    });

    return this.organizationReadRepository.getBusinessDetails(businessId);
  }
}

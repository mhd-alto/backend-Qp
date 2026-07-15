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
import { StatusReasonRequestDto } from '../../api/dto/status.request';
import {
  BUSINESS_REPOSITORY,
  BusinessRepository,
} from '../../domain/repositories/business.repository';
import { OrganizationReadRepository } from '../../infrastructure/persistence/typeorm/queries/organization-read.repository';

@Injectable()
export class ChangeBusinessStatusService {
  constructor(
    @Inject(BUSINESS_REPOSITORY)
    private readonly businessRepository: BusinessRepository,
    @Inject(AUDIT_WRITER)
    private readonly auditWriter: AuditWriter,
    private readonly organizationReadRepository: OrganizationReadRepository,
  ) {}

  async execute(
    businessId: string,
    body: StatusReasonRequestDto,
    actor: AuthenticatedPrincipal,
  ) {
    const business = await this.businessRepository.findById(businessId);

    if (!business) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: FRIENDLY_MESSAGES.RESOURCE_NOT_FOUND,
      });
    }

    if (business.status === body.status) {
      return this.organizationReadRepository.getBusinessDetails(businessId);
    }

    if (!this.isTransitionAllowed(business.status, body.status)) {
      throw new ConflictException({
        code: 'REQUEST_FAILED',
        message: {
          ar: 'لا يمكن تطبيق حالة النشاط التجاري المطلوبة من حالته الحالية.',
          en: 'The requested business status transition is not allowed from the current state.',
        },
      });
    }

    await this.businessRepository.update(businessId, { status: body.status });
    await this.auditWriter.write({
      actorUserId: actor.id,
      businessId,
      action: 'BUSINESS_STATUS_CHANGED',
      entityType: 'BUSINESS',
      entityId: businessId,
      metadata: {
        status: body.status,
        reason: body.reason,
      },
    });

    return this.organizationReadRepository.getBusinessDetails(businessId);
  }

  private isTransitionAllowed(current: string, next: string): boolean {
    const allowedTransitions: Record<string, string[]> = {
      ACTIVE: ['SUSPENDED', 'INACTIVE'],
      SUSPENDED: ['ACTIVE', 'INACTIVE'],
      INACTIVE: ['ACTIVE'],
    };

    return allowedTransitions[current]?.includes(next) ?? false;
  }
}

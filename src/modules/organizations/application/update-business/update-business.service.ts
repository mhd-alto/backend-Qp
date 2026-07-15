import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FRIENDLY_MESSAGES } from '../../../../common/constants/localized-messages';
import { normalizeEmail } from '../../../../common/utilities/normalize-email';
import { normalizePhone } from '../../../../common/utilities/normalize-phone';
import { AuthenticatedPrincipal } from '../../../../common/types/authenticated-principal';
import { AUDIT_WRITER } from '../../../audit/contracts/audit.tokens';
import { AuditWriter } from '../../../audit/contracts/audit-writer';
import { CATEGORY_READER, CategoryReader } from '../../../reference-data/contracts/category-reader';
import { LOCATION_READER, LocationReader } from '../../../reference-data/contracts/location-reader';
import { UpdateBusinessRequestDto } from '../../api/dto/update-business.request';
import {
  BRANCH_REPOSITORY,
  BranchRepository,
} from '../../domain/repositories/branch.repository';
import {
  BUSINESS_CATEGORY_REPOSITORY,
  BusinessCategoryRepository,
} from '../../domain/repositories/business-category.repository';
import {
  BUSINESS_REPOSITORY,
  BusinessRepository,
} from '../../domain/repositories/business.repository';
import { OrganizationReadRepository } from '../../infrastructure/persistence/typeorm/queries/organization-read.repository';

@Injectable()
export class UpdateBusinessService {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(BUSINESS_REPOSITORY)
    private readonly businessRepository: BusinessRepository,
    @Inject(BRANCH_REPOSITORY)
    private readonly branchRepository: BranchRepository,
    @Inject(BUSINESS_CATEGORY_REPOSITORY)
    private readonly businessCategoryRepository: BusinessCategoryRepository,
    @Inject(CATEGORY_READER)
    private readonly categoryReader: CategoryReader,
    @Inject(LOCATION_READER)
    private readonly locationReader: LocationReader,
    @Inject(AUDIT_WRITER)
    private readonly auditWriter: AuditWriter,
    private readonly organizationReadRepository: OrganizationReadRepository,
  ) {}

  async execute(
    businessId: string,
    body: UpdateBusinessRequestDto,
    actor: AuthenticatedPrincipal,
  ) {
    const business = await this.businessRepository.findById(businessId);

    if (!business) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: FRIENDLY_MESSAGES.RESOURCE_NOT_FOUND,
      });
    }

    if (body.primaryCategoryId) {
      const category = await this.categoryReader.findById(body.primaryCategoryId);

      if (!category || category.status !== 'ACTIVE') {
        throw new NotFoundException({
          code: 'RESOURCE_NOT_FOUND',
          message: FRIENDLY_MESSAGES.RESOURCE_NOT_FOUND,
        });
      }
    }

    if (body.slug && body.slug !== business.slug) {
      throw new ConflictException({
        code: 'REQUEST_FAILED',
        message: {
          ar: 'لا يدعم هذا الإصدار تعديل الرابط المختصر للنشاط التجاري.',
          en: 'Updating the business slug is not supported in this MVP flow.',
        },
      });
    }

    if (body.branch?.locationId) {
      const location = await this.locationReader.findById(body.branch.locationId);

      if (!location || location.status !== 'ACTIVE') {
        throw new NotFoundException({
          code: 'RESOURCE_NOT_FOUND',
          message: FRIENDLY_MESSAGES.RESOURCE_NOT_FOUND,
        });
      }
    }

    await this.dataSource.transaction(async (manager) => {
      await this.businessRepository.update(
        businessId,
        {
          legalName: body.legalName?.trim() ?? business.legalName,
          displayName: body.displayName?.trim() ?? business.displayName,
          displayNameEn: Object.prototype.hasOwnProperty.call(body, 'displayNameEn')
            ? body.displayNameEn?.trim() ?? null
            : business.displayNameEn,
          description: Object.prototype.hasOwnProperty.call(body, 'description')
            ? body.description?.trim() ?? null
            : business.description,
          descriptionEn: Object.prototype.hasOwnProperty.call(body, 'descriptionEn')
            ? body.descriptionEn?.trim() ?? null
            : business.descriptionEn,
          logoUrl: Object.prototype.hasOwnProperty.call(body, 'logoUrl')
            ? body.logoUrl?.trim() ?? null
            : business.logoUrl,
          coverUrl: Object.prototype.hasOwnProperty.call(body, 'coverUrl')
            ? body.coverUrl?.trim() ?? null
            : business.coverUrl,
          email: Object.prototype.hasOwnProperty.call(body, 'email')
            ? normalizeEmail(body.email)
            : business.email,
          phone: body.phone ? normalizePhone(body.phone) ?? body.phone : business.phone,
        },
        manager,
      );

      if (body.primaryCategoryId) {
        await this.businessCategoryRepository.updatePrimary(
          businessId,
          body.primaryCategoryId,
          manager,
        );
      }

      if (body.branch) {
        const primaryBranch = await this.branchRepository.findPrimaryByBusinessId(businessId);

        if (!primaryBranch) {
          throw new NotFoundException({
            code: 'RESOURCE_NOT_FOUND',
            message: FRIENDLY_MESSAGES.RESOURCE_NOT_FOUND,
          });
        }

        await this.branchRepository.update(
          primaryBranch.id,
          {
            name: body.branch.name?.trim() ?? primaryBranch.name,
            nameEn: Object.prototype.hasOwnProperty.call(body.branch, 'nameEn')
              ? body.branch.nameEn?.trim() ?? null
              : primaryBranch.nameEn,
            slug: body.branch.slug?.trim() ?? primaryBranch.slug,
            addressLine: body.branch.addressLine?.trim() ?? primaryBranch.addressLine,
            addressLineEn: Object.prototype.hasOwnProperty.call(body.branch, 'addressLineEn')
              ? body.branch.addressLineEn?.trim() ?? null
              : primaryBranch.addressLineEn,
            locationId: Object.prototype.hasOwnProperty.call(body.branch, 'locationId')
              ? body.branch.locationId ?? null
              : primaryBranch.locationId,
            phone: Object.prototype.hasOwnProperty.call(body.branch, 'phone')
              ? normalizePhone(body.branch.phone) ?? null
              : primaryBranch.phone,
          },
          manager,
        );
      }
    });

    await this.auditWriter.write({
      actorUserId: actor.id,
      businessId,
      action: 'BUSINESS_UPDATED',
      entityType: 'BUSINESS',
      entityId: businessId,
    });

    return this.organizationReadRepository.getBusinessDetails(businessId);
  }
}

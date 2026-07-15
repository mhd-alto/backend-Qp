import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { FRIENDLY_MESSAGES } from '../../../../common/constants/localized-messages';
import { normalizeEmail } from '../../../../common/utilities/normalize-email';
import { normalizePhone } from '../../../../common/utilities/normalize-phone';
import { AuthenticatedPrincipal } from '../../../../common/types/authenticated-principal';
import { AUDIT_WRITER } from '../../../audit/contracts/audit.tokens';
import { AuditWriter } from '../../../audit/contracts/audit-writer';
import { CATEGORY_READER, CategoryReader } from '../../../reference-data/contracts/category-reader';
import { LOCATION_READER, LocationReader } from '../../../reference-data/contracts/location-reader';
import { CreateStaffRequestDto } from '../../api/dto/create-staff.request';
import { ProvisionBusinessRequestDto } from '../../api/dto/provision-business.request';
import {
  BRANCH_REPOSITORY,
  BranchRepository,
} from '../../domain/repositories/branch.repository';
import {
  BUSINESS_CATEGORY_REPOSITORY,
  BusinessCategoryRepository,
} from '../../domain/repositories/business-category.repository';
import {
  BUSINESS_MEMBERSHIP_REPOSITORY,
  BusinessMembershipRepository,
} from '../../domain/repositories/business-membership.repository';
import {
  BUSINESS_REPOSITORY,
  BusinessRepository,
} from '../../domain/repositories/business.repository';
import {
  MEMBERSHIP_BRANCH_REPOSITORY,
  MembershipBranchRepository,
} from '../../domain/repositories/membership-branch.repository';
import { OrganizationReadRepository } from '../../infrastructure/persistence/typeorm/queries/organization-read.repository';
import { OrganizationUserProvisioningService } from '../shared/organization-user-provisioning.service';

@Injectable()
export class ProvisionBusinessService {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(CATEGORY_READER)
    private readonly categoryReader: CategoryReader,
    @Inject(LOCATION_READER)
    private readonly locationReader: LocationReader,
    @Inject(BUSINESS_REPOSITORY)
    private readonly businessRepository: BusinessRepository,
    @Inject(BRANCH_REPOSITORY)
    private readonly branchRepository: BranchRepository,
    @Inject(BUSINESS_CATEGORY_REPOSITORY)
    private readonly businessCategoryRepository: BusinessCategoryRepository,
    @Inject(BUSINESS_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: BusinessMembershipRepository,
    @Inject(MEMBERSHIP_BRANCH_REPOSITORY)
    private readonly membershipBranchRepository: MembershipBranchRepository,
    @Inject(AUDIT_WRITER)
    private readonly auditWriter: AuditWriter,
    private readonly organizationReadRepository: OrganizationReadRepository,
    private readonly organizationUserProvisioningService: OrganizationUserProvisioningService,
  ) {}

  async execute(
    body: ProvisionBusinessRequestDto,
    actor: AuthenticatedPrincipal,
  ) {
    const category = await this.categoryReader.findById(body.primaryCategoryId);

    if (!category || category.status !== 'ACTIVE') {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: FRIENDLY_MESSAGES.RESOURCE_NOT_FOUND,
      });
    }

    const existingBusiness = await this.businessRepository.findBySlug(body.slug);

    if (existingBusiness) {
      throw new ConflictException({
        code: 'IDENTIFIER_ALREADY_IN_USE',
        message: {
          ar: 'هذا الرابط المختصر للنشاط التجاري مستخدم بالفعل.',
          en: 'This business slug is already in use.',
        },
      });
    }

    if (body.branch.locationId) {
      const location = await this.locationReader.findById(body.branch.locationId);

      if (!location || location.status !== 'ACTIVE') {
        throw new NotFoundException({
          code: 'RESOURCE_NOT_FOUND',
          message: FRIENDLY_MESSAGES.RESOURCE_NOT_FOUND,
        });
      }
    }

    const businessId = await this.dataSource.transaction(async (manager) => {
      const business = await this.businessRepository.create(
        {
          legalName: body.legalName?.trim() ?? null,
          displayName: body.displayName.trim(),
          displayNameEn: body.displayNameEn?.trim() ?? null,
          slug: body.slug.trim(),
          description: body.description?.trim() ?? null,
          descriptionEn: body.descriptionEn?.trim() ?? null,
          logoUrl: body.logoUrl?.trim() ?? null,
          coverUrl: body.coverUrl?.trim() ?? null,
          email: normalizeEmail(body.email),
          phone: normalizePhone(body.phone) ?? body.phone,
          createdByUserId: actor.id,
        },
        manager,
      );

      await this.businessCategoryRepository.createPrimary(
        business.id,
        body.primaryCategoryId,
        manager,
      );

      const branch = await this.branchRepository.create(
        {
          businessId: business.id,
          name: body.branch.name.trim(),
          nameEn: body.branch.nameEn?.trim() ?? null,
          slug: body.branch.slug.trim(),
          addressLine: body.branch.addressLine.trim(),
          addressLineEn: body.branch.addressLineEn?.trim() ?? null,
          locationId: body.branch.locationId ?? null,
          phone: normalizePhone(body.branch.phone) ?? null,
          isPrimary: true,
        },
        manager,
      );

      const managerUser = await this.organizationUserProvisioningService.createOrReuseUser(
        body.manager,
        manager,
      );

      const ownerMembership = await this.membershipRepository.create(
        {
          businessId: business.id,
          userId: managerUser.userId,
          role: 'OWNER',
          status: 'ACTIVE',
          invitedByUserId: actor.id,
          joinedAt: new Date(),
        },
        manager,
      );

      await this.membershipBranchRepository.assignToBranch(
        ownerMembership.id,
        branch.id,
        business.id,
        manager,
      );

      for (const staffMember of body.staff ?? []) {
        await this.createStaffInternal(business.id, branch.id, staffMember, actor.id, manager);
      }

      return business.id;
    });

    await this.auditWriter.write({
      actorUserId: actor.id,
      businessId,
      action: 'BUSINESS_PROVISIONED',
      entityType: 'BUSINESS',
      entityId: businessId,
      metadata: {
        slug: body.slug,
      },
    });

    return this.organizationReadRepository.getBusinessDetails(businessId);
  }

  async createStaff(
    businessId: string,
    body: CreateStaffRequestDto,
    actor: AuthenticatedPrincipal,
  ) {
    const business = await this.businessRepository.findById(businessId);

    if (!business) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: FRIENDLY_MESSAGES.RESOURCE_NOT_FOUND,
      });
    }

    const primaryBranch = await this.branchRepository.findPrimaryByBusinessId(businessId);

    if (!primaryBranch) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: FRIENDLY_MESSAGES.RESOURCE_NOT_FOUND,
      });
    }

    await this.dataSource.transaction(async (manager) => {
      await this.createStaffInternal(
        businessId,
        primaryBranch.id,
        body,
        actor.id,
        manager,
      );
    });

    await this.auditWriter.write({
      actorUserId: actor.id,
      businessId,
      action: 'BUSINESS_STAFF_ADDED',
      entityType: 'BUSINESS',
      entityId: businessId,
      metadata: {
        email: normalizeEmail(body.email),
        phone: normalizePhone(body.phone),
      },
    });

    return this.organizationReadRepository.getBusinessDetails(businessId);
  }

  private async createStaffInternal(
    businessId: string,
    primaryBranchId: string,
    person: CreateStaffRequestDto,
    actorUserId: string,
    manager: EntityManager,
  ): Promise<void> {
    const user = await this.organizationUserProvisioningService.createOrReuseUser(person, manager);
    const existingMembership = await this.membershipRepository.findByBusinessAndUser(
      businessId,
      user.userId,
    );

    if (existingMembership) {
      throw new ConflictException({
        code: 'IDENTIFIER_ALREADY_IN_USE',
        message: {
          ar: 'هذا المستخدم عضو بالفعل ضمن هذا النشاط التجاري.',
          en: 'This user is already a member of this business.',
        },
      });
    }

    const membership = await this.membershipRepository.create(
      {
        businessId,
        userId: user.userId,
        role: 'STAFF',
        status: 'ACTIVE',
        invitedByUserId: actorUserId,
        joinedAt: new Date(),
      },
      manager,
    );

    await this.membershipBranchRepository.assignToBranch(
      membership.id,
      primaryBranchId,
      businessId,
      manager,
    );
  }
}

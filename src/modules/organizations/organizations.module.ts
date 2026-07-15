import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { IdentityModule } from '../identity/identity.module';
import { ReferenceDataModule } from '../reference-data/reference-data.module';
import { AdminBusinessesController } from './api/admin-businesses.controller';
import { BusinessProfileController } from './api/business-profile.controller';
import { AddStaffMemberService } from './application/add-staff-member/add-staff-member.service';
import { ChangeBusinessStatusService } from './application/change-business-status/change-business-status.service';
import { ChangeMembershipStatusService } from './application/change-membership-status/change-membership-status.service';
import { GetAdminBusinessService } from './application/get-admin-business/get-admin-business.service';
import { GetBusinessProfileService } from './application/get-business-profile/get-business-profile.service';
import { ListAdminBusinessesService } from './application/list-admin-businesses/list-admin-businesses.service';
import { ProvisionBusinessService } from './application/provision-business/provision-business.service';
import { DemoMarketSeedService } from './application/seeds/demo-market.seed';
import { OrganizationUserProvisioningService } from './application/shared/organization-user-provisioning.service';
import { UpdateBusinessService } from './application/update-business/update-business.service';
import { BRANCH_REPOSITORY } from './domain/repositories/branch.repository';
import { BUSINESS_CATEGORY_REPOSITORY } from './domain/repositories/business-category.repository';
import { BUSINESS_MEMBERSHIP_REPOSITORY } from './domain/repositories/business-membership.repository';
import { BUSINESS_REPOSITORY } from './domain/repositories/business.repository';
import { MEMBERSHIP_BRANCH_REPOSITORY } from './domain/repositories/membership-branch.repository';
import { BranchOrmEntity } from './infrastructure/persistence/typeorm/entities/branch.orm-entity';
import { BusinessCategoryOrmEntity } from './infrastructure/persistence/typeorm/entities/business-category.orm-entity';
import { BusinessMembershipOrmEntity } from './infrastructure/persistence/typeorm/entities/business-membership.orm-entity';
import { BusinessOrmEntity } from './infrastructure/persistence/typeorm/entities/business.orm-entity';
import { MembershipBranchOrmEntity } from './infrastructure/persistence/typeorm/entities/membership-branch.orm-entity';
import { OrganizationReadRepository } from './infrastructure/persistence/typeorm/queries/organization-read.repository';
import { TypeOrmBranchRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-branch.repository';
import { TypeOrmBusinessCategoryRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-business-category.repository';
import { TypeOrmBusinessMembershipRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-business-membership.repository';
import { TypeOrmBusinessRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-business.repository';
import { TypeOrmMembershipBranchRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-membership-branch.repository';
import { UserOrmEntity } from '../identity/infrastructure/persistence/typeorm/entities/user.orm-entity';
import { UserProfileOrmEntity } from '../identity/infrastructure/persistence/typeorm/entities/user-profile.orm-entity';
import { CategoryOrmEntity } from '../reference-data/infrastructure/persistence/typeorm/entities/category.orm-entity';
import { LocationOrmEntity } from '../reference-data/infrastructure/persistence/typeorm/entities/location.orm-entity';

@Module({
  imports: [
    AuthModule,
    AuditModule,
    IdentityModule,
    ReferenceDataModule,
    TypeOrmModule.forFeature([
      BusinessOrmEntity,
      BusinessCategoryOrmEntity,
      BranchOrmEntity,
      BusinessMembershipOrmEntity,
      MembershipBranchOrmEntity,
      UserOrmEntity,
      UserProfileOrmEntity,
      CategoryOrmEntity,
      LocationOrmEntity,
    ]),
  ],
  controllers: [AdminBusinessesController, BusinessProfileController],
  providers: [
    OrganizationReadRepository,
    TypeOrmBusinessRepository,
    TypeOrmBranchRepository,
    TypeOrmBusinessCategoryRepository,
    TypeOrmBusinessMembershipRepository,
    TypeOrmMembershipBranchRepository,
    OrganizationUserProvisioningService,
    DemoMarketSeedService,
    ProvisionBusinessService,
    ListAdminBusinessesService,
    GetAdminBusinessService,
    UpdateBusinessService,
    ChangeBusinessStatusService,
    AddStaffMemberService,
    ChangeMembershipStatusService,
    GetBusinessProfileService,
    {
      provide: BUSINESS_REPOSITORY,
      useExisting: TypeOrmBusinessRepository,
    },
    {
      provide: BRANCH_REPOSITORY,
      useExisting: TypeOrmBranchRepository,
    },
    {
      provide: BUSINESS_CATEGORY_REPOSITORY,
      useExisting: TypeOrmBusinessCategoryRepository,
    },
    {
      provide: BUSINESS_MEMBERSHIP_REPOSITORY,
      useExisting: TypeOrmBusinessMembershipRepository,
    },
    {
      provide: MEMBERSHIP_BRANCH_REPOSITORY,
      useExisting: TypeOrmMembershipBranchRepository,
    },
  ],
  exports: [
    BUSINESS_REPOSITORY,
    BUSINESS_MEMBERSHIP_REPOSITORY,
    BRANCH_REPOSITORY,
    BUSINESS_CATEGORY_REPOSITORY,
    MEMBERSHIP_BRANCH_REPOSITORY,
    OrganizationReadRepository,
  ],
})
export class OrganizationsModule {}

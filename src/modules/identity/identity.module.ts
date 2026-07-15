import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CustomerProfileController } from './api/customer-profile.controller';
import {
  IDENTITY_ACCOUNT_CREATOR,
  IDENTITY_READER,
  USER_STATUS_READER,
} from './contracts/identity.tokens';
import { CreateUserService } from './application/create-user/create-user.service';
import { USER_CONSENT_REPOSITORY } from './domain/repositories/user-consent.repository';
import { USER_PROFILE_REPOSITORY } from './domain/repositories/user-profile.repository';
import { USER_REPOSITORY } from './domain/repositories/user.repository';
import { UserOrmEntity } from './infrastructure/persistence/typeorm/entities/user.orm-entity';
import { UserConsentOrmEntity } from './infrastructure/persistence/typeorm/entities/user-consent.orm-entity';
import { UserProfileOrmEntity } from './infrastructure/persistence/typeorm/entities/user-profile.orm-entity';
import { TypeOrmUserConsentRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-user-consent.repository';
import { TypeOrmUserProfileRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-user-profile.repository';
import { TypeOrmUserRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-user.repository';
import { DemoCustomerSeedService } from '../../infrastructure/database/seeds/demo-customer.seed';
import { PlatformAdminSeedService } from '../../infrastructure/database/seeds/platform-admin.seed';
import { AdminUsersController } from './api/admin-users.controller';
import { AdminDashboardController } from './api/admin-dashboard.controller';
import { ListAdminUsersService } from './application/list-admin-users/list-admin-users.service';
import { SetUserStatusService } from './application/set-user-status/set-user-status.service';
import { AdminUserReadRepository } from './infrastructure/persistence/typeorm/queries/admin-user-read.repository';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    AuditModule,
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([
      UserOrmEntity,
      UserProfileOrmEntity,
      UserConsentOrmEntity,
    ]),
  ],
  providers: [
    CreateUserService,
    ListAdminUsersService,
    SetUserStatusService,
    PlatformAdminSeedService,
    DemoCustomerSeedService,
    AdminUserReadRepository,
    TypeOrmUserRepository,
    TypeOrmUserProfileRepository,
    TypeOrmUserConsentRepository,
    {
      provide: USER_REPOSITORY,
      useExisting: TypeOrmUserRepository,
    },
    {
      provide: USER_PROFILE_REPOSITORY,
      useExisting: TypeOrmUserProfileRepository,
    },
    {
      provide: USER_CONSENT_REPOSITORY,
      useExisting: TypeOrmUserConsentRepository,
    },
    {
      provide: IDENTITY_ACCOUNT_CREATOR,
      useExisting: CreateUserService,
    },
    {
      provide: IDENTITY_READER,
      useExisting: CreateUserService,
    },
    {
      provide: USER_STATUS_READER,
      useExisting: CreateUserService,
    },
  ],
  controllers: [CustomerProfileController, AdminUsersController, AdminDashboardController],
  exports: [
    IDENTITY_ACCOUNT_CREATOR,
    IDENTITY_READER,
    USER_STATUS_READER,
    USER_REPOSITORY,
    USER_PROFILE_REPOSITORY,
    USER_CONSENT_REPOSITORY,
  ],
})
export class IdentityModule {}

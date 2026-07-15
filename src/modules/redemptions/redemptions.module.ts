import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { IdentityModule } from '../identity/identity.module';
import { AuditModule } from '../audit/audit.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { StaffRedemptionsController } from './api/staff-redemptions.controller';
import { ValidateCouponService } from './application/validate-coupon/validate-coupon.service';
import { RedeemCouponService } from './application/redeem-coupon/redeem-coupon.service';
import { ListStaffRedemptionsService } from './application/list-staff-redemptions/list-staff-redemptions.service';
import { RedemptionOrmEntity } from './infrastructure/persistence/typeorm/entities/redemption.orm-entity';
import { CouponValidationAttemptOrmEntity } from './infrastructure/persistence/typeorm/entities/coupon-validation-attempt.orm-entity';
import { CouponOrmEntity } from '../coupons/infrastructure/persistence/typeorm/entities/coupon.orm-entity';
import { CampaignOrmEntity } from '../campaigns/infrastructure/persistence/typeorm/entities/campaign.orm-entity';
import { CampaignBenefitOrmEntity } from '../campaigns/infrastructure/persistence/typeorm/entities/campaign-benefit.orm-entity';
import { CampaignBranchOrmEntity } from '../campaigns/infrastructure/persistence/typeorm/entities/campaign-branch.orm-entity';
import { BusinessMembershipOrmEntity } from '../organizations/infrastructure/persistence/typeorm/entities/business-membership.orm-entity';
import { MembershipBranchOrmEntity } from '../organizations/infrastructure/persistence/typeorm/entities/membership-branch.orm-entity';
import { BusinessOrmEntity } from '../organizations/infrastructure/persistence/typeorm/entities/business.orm-entity';

@Module({
  imports: [
    AuthModule,
    IdentityModule,
    AuditModule,
    OrganizationsModule,
    TypeOrmModule.forFeature([
      RedemptionOrmEntity,
      CouponValidationAttemptOrmEntity,
      CouponOrmEntity,
      CampaignOrmEntity,
      CampaignBenefitOrmEntity,
      CampaignBranchOrmEntity,
      BusinessMembershipOrmEntity,
      MembershipBranchOrmEntity,
      BusinessOrmEntity,
    ]),
  ],
  controllers: [StaffRedemptionsController],
  providers: [
    ValidateCouponService,
    RedeemCouponService,
    ListStaffRedemptionsService,
  ],
  exports: [
    ValidateCouponService,
    RedeemCouponService,
    ListStaffRedemptionsService,
  ],
})
export class RedemptionsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { IdentityModule } from '../identity/identity.module';
import { CustomerSavingsController } from './api/customer-savings.controller';
import { BusinessImpactController } from './api/business-impact.controller';
import { AdminImpactController } from './api/admin-impact.controller';
import { RedemptionOrmEntity } from '../redemptions/infrastructure/persistence/typeorm/entities/redemption.orm-entity';
import { CouponOrmEntity } from '../coupons/infrastructure/persistence/typeorm/entities/coupon.orm-entity';
import { BusinessMembershipOrmEntity } from '../organizations/infrastructure/persistence/typeorm/entities/business-membership.orm-entity';
import { BusinessOrmEntity } from '../organizations/infrastructure/persistence/typeorm/entities/business.orm-entity';

@Module({
  imports: [
    AuthModule,
    IdentityModule,
    TypeOrmModule.forFeature([
      RedemptionOrmEntity,
      CouponOrmEntity,
      BusinessMembershipOrmEntity,
      BusinessOrmEntity,
    ]),
  ],
  controllers: [
    CustomerSavingsController,
    BusinessImpactController,
    AdminImpactController,
  ],
})
export class ImpactModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscoveryModule } from '../discovery/discovery.module';
import { AuthModule } from '../auth/auth.module';
import { IdentityModule } from '../identity/identity.module';
import { BusinessOrmEntity } from '../organizations/infrastructure/persistence/typeorm/entities/business.orm-entity';
import { CampaignLimitOrmEntity } from '../campaigns/infrastructure/persistence/typeorm/entities/campaign-limit.orm-entity';
import { CampaignOrmEntity } from '../campaigns/infrastructure/persistence/typeorm/entities/campaign.orm-entity';
import { CustomerCouponsController } from './api/customer-coupons.controller';
import { CustomerCouponsService } from './application/customer-coupons.service';
import { COUPON_READER } from './contracts/coupon.tokens';
import { COUPON_CODE_GENERATOR } from './domain/services/coupon-code-generator';
import { COUPON_EXPIRY_CALCULATOR } from './domain/services/coupon-expiry-calculator';
import { DefaultCouponExpiryCalculatorService } from './domain/services/default-coupon-expiry-calculator.service';
import { RandomCouponCodeGeneratorService } from './domain/services/random-coupon-code-generator.service';
import { CouponOrmEntity } from './infrastructure/persistence/typeorm/entities/coupon.orm-entity';
import { TypeOrmCouponRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-coupon.repository';

@Module({
  imports: [
    AuthModule,
    IdentityModule,
    DiscoveryModule,
    TypeOrmModule.forFeature([
      CouponOrmEntity,
      CampaignOrmEntity,
      CampaignLimitOrmEntity,
      BusinessOrmEntity,
    ]),
  ],
  controllers: [CustomerCouponsController],
  providers: [
    CustomerCouponsService,
    TypeOrmCouponRepository,
    {
      provide: COUPON_READER,
      useExisting: TypeOrmCouponRepository,
    },
    {
      provide: COUPON_CODE_GENERATOR,
      useClass: RandomCouponCodeGeneratorService,
    },
    {
      provide: COUPON_EXPIRY_CALCULATOR,
      useClass: DefaultCouponExpiryCalculatorService,
    },
  ],
  exports: [COUPON_READER],
})
export class CouponsModule {}

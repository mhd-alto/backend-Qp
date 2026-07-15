import { Controller, Get, UseGuards, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedPrincipal } from '../../../common/types/authenticated-principal';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { FeatureFlagGuard } from '../../../common/guards/feature-flag.guard';
import { RequireFeature } from '../../../common/decorators/require-feature.decorator';
import { RedemptionOrmEntity } from '../../redemptions/infrastructure/persistence/typeorm/entities/redemption.orm-entity';
import { CouponOrmEntity } from '../../coupons/infrastructure/persistence/typeorm/entities/coupon.orm-entity';

@ApiTags('Customer Savings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@RequireFeature('impactMetrics')
@Controller('customer/savings')
export class CustomerSavingsController {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  @Get('summary')
  @Version('1')
  @ApiOperation({ summary: 'Get total savings summary for the current customer' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        totalSavings: { type: 'number', example: 12500.00 },
        currencyCode: { type: 'string', example: 'SYP' },
        breakdown: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              currencyCode: { type: 'string' },
              amount: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async getSummary(@CurrentUser() actor: AuthenticatedPrincipal) {
    // Sum discount_amount from redemptions joining coupons on user_id
    const redemptions = await this.entityManager
      .createQueryBuilder(RedemptionOrmEntity, 'r')
      .innerJoin(CouponOrmEntity, 'c', 'c.id = r.couponId')
      .where('c.userId = :userId', { userId: actor.id })
      .andWhere("r.status = 'CONFIRMED'")
      .getMany();

    const breakdownMap = new Map<string, number>();
    let totalSavings = 0;

    for (const r of redemptions) {
      const discount = r.discountAmount ? Number(r.discountAmount) : 0;
      const currency = r.currencyCode || 'SYP';
      totalSavings += discount;
      breakdownMap.set(currency, (breakdownMap.get(currency) || 0) + discount);
    }

    const breakdown = Array.from(breakdownMap.entries()).map(([currencyCode, amount]) => ({
      currencyCode,
      amount: Math.round(amount * 100) / 100,
    }));

    return {
      totalSavings: Math.round(totalSavings * 100) / 100,
      currencyCode: 'SYP',
      breakdown,
    };
  }
}

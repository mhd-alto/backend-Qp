import { Controller, Get, Query, UseGuards, Version, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedPrincipal } from '../../../common/types/authenticated-principal';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { FeatureFlagGuard } from '../../../common/guards/feature-flag.guard';
import { RequireFeature } from '../../../common/decorators/require-feature.decorator';
import { RedemptionOrmEntity } from '../../redemptions/infrastructure/persistence/typeorm/entities/redemption.orm-entity';
import { BusinessMembershipOrmEntity } from '../../organizations/infrastructure/persistence/typeorm/entities/business-membership.orm-entity';

@ApiTags('Business Impact')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@RequireFeature('impactMetrics')
@Controller('business/impact')
export class BusinessImpactController {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  @Get('summary')
  @Version('1')
  @ApiOperation({ summary: 'Get business sales impact and savings metrics' })
  @ApiQuery({ name: 'businessId', required: false, description: 'Optional Business UUID' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        businessId: { type: 'string' },
        salesInfluenced: { type: 'number', example: 500000.00 },
        customerSavings: { type: 'number', example: 75000.00 },
        avgBasket: { type: 'number', example: 12500.00 },
        totalRedemptions: { type: 'number', example: 40 },
        currencyCode: { type: 'string', example: 'SYP' },
      },
    },
  })
  async getSummary(
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Query('businessId') businessId?: string,
  ) {
    // 1. Resolve membership
    const membership = await this.entityManager.findOne(BusinessMembershipOrmEntity, {
      where: businessId
        ? { userId: actor.id, businessId, status: 'ACTIVE' }
        : { userId: actor.id, status: 'ACTIVE' },
    });

    if (!membership) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: {
          ar: 'ليس لديك صلاحية للوصول إلى بيانات هذا النشاط التجاري.',
          en: 'You do not have permission to access this business metrics.',
        },
      });
    }

    const targetBusinessId = membership.businessId;

    // 2. Fetch redemptions aggregates for the business
    const redemptions = await this.entityManager.find(RedemptionOrmEntity, {
      where: { businessId: targetBusinessId, status: 'CONFIRMED' },
    });

    let salesInfluenced = 0; // sum of finalAmount
    let customerSavings = 0; // sum of discountAmount
    let sumOriginal = 0;
    let countOriginal = 0;

    for (const r of redemptions) {
      const finalAmt = r.finalAmount ? Number(r.finalAmount) : 0;
      const discountAmt = r.discountAmount ? Number(r.discountAmount) : 0;
      const originalAmt = r.originalAmount ? Number(r.originalAmount) : 0;

      salesInfluenced += finalAmt;
      customerSavings += discountAmt;

      if (originalAmt > 0) {
        sumOriginal += originalAmt;
        countOriginal++;
      }
    }

    const avgBasket = countOriginal > 0 ? (sumOriginal / countOriginal) : 0;

    return {
      businessId: targetBusinessId,
      salesInfluenced: Math.round(salesInfluenced * 100) / 100,
      customerSavings: Math.round(customerSavings * 100) / 100,
      avgBasket: Math.round(avgBasket * 100) / 100,
      totalRedemptions: redemptions.length,
      currencyCode: 'SYP',
    };
  }
}

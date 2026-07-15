import { Controller, Get, UseGuards, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { PlatformRoleGuard } from '../../auth/infrastructure/guards/platform-role.guard';
import { PlatformRoles } from '../../../common/decorators/platform-roles.decorator';
import { FeatureFlagGuard } from '../../../common/guards/feature-flag.guard';
import { RequireFeature } from '../../../common/decorators/require-feature.decorator';
import { RedemptionOrmEntity } from '../../redemptions/infrastructure/persistence/typeorm/entities/redemption.orm-entity';
import { BusinessOrmEntity } from '../../organizations/infrastructure/persistence/typeorm/entities/business.orm-entity';

@ApiTags('Admin Platform Impact')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlatformRoleGuard, FeatureFlagGuard)
@PlatformRoles('ADMIN')
@RequireFeature('impactMetrics')
@Controller('admin/impact')
export class AdminImpactController {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  @Get('platform')
  @Version('1')
  @ApiOperation({ summary: 'Get platform-wide totals of savings, influenced sales, active businesses, and successful redemptions' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        totalSavings: { type: 'number', example: 1500000.00 },
        totalInfluencedSales: { type: 'number', example: 10000000.00 },
        activeBusinesses: { type: 'number', example: 120 },
        successfulRedemptions: { type: 'number', example: 850 },
      },
    },
  })
  async getPlatformImpact() {
    // 1. Count active businesses
    const activeBusinesses = await this.entityManager.count(BusinessOrmEntity, {
      where: { status: 'ACTIVE' },
    });

    // 2. Fetch all redemptions
    const redemptions = await this.entityManager.find(RedemptionOrmEntity, {
      where: { status: 'CONFIRMED' },
    });

    let totalSavings = 0;
    let totalInfluencedSales = 0;

    for (const r of redemptions) {
      totalSavings += r.discountAmount ? Number(r.discountAmount) : 0;
      totalInfluencedSales += r.finalAmount ? Number(r.finalAmount) : 0;
    }

    return {
      totalSavings: Math.round(totalSavings * 100) / 100,
      totalInfluencedSales: Math.round(totalInfluencedSales * 100) / 100,
      activeBusinesses,
      successfulRedemptions: redemptions.length,
    };
  }
}

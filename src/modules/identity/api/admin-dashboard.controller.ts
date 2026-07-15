import { Controller, Get, UseGuards, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, IsNull } from 'typeorm';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { PlatformRoleGuard } from '../../auth/infrastructure/guards/platform-role.guard';
import { PlatformRoles } from '../../../common/decorators/platform-roles.decorator';
import { UserOrmEntity } from '../infrastructure/persistence/typeorm/entities/user.orm-entity';
import { CampaignOrmEntity } from '../../campaigns/infrastructure/persistence/typeorm/entities/campaign.orm-entity';
import { CouponOrmEntity } from '../../coupons/infrastructure/persistence/typeorm/entities/coupon.orm-entity';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlatformRoleGuard)
@PlatformRoles('ADMIN')
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  @Get('stats')
  @Version('1')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        usersCount: { type: 'number' },
        campaignsCount: { type: 'number' },
        couponsCount: { type: 'number' },
      },
    },
  })
  async getStats() {
    const usersCount = await this.entityManager.count(UserOrmEntity, {
      where: { deletedAt: IsNull() },
    });
    const campaignsCount = await this.entityManager.count(CampaignOrmEntity, {
      where: { deletedAt: IsNull() },
    });
    const couponsCount = await this.entityManager.count(CouponOrmEntity);

    return {
      usersCount,
      campaignsCount,
      couponsCount,
    };
  }
}

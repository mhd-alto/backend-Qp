import {
  Controller,
  Get,
  Param,
  UseGuards,
  Version,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedPrincipal } from '../../../common/types/authenticated-principal';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { GetCampaignAnalyticsService } from '../application/get-campaign-analytics/get-campaign-analytics.service';
import { GetCampaignSourceAnalyticsService } from '../application/get-campaign-source-analytics/get-campaign-source-analytics.service';
import {
  CampaignAnalyticsResponseDto,
  SourceAnalyticsResponseDto,
} from './dto/analytics.response';

@ApiTags('Business Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('business/campaigns')
export class BusinessAnalyticsController {
  constructor(
    private readonly getCampaignAnalyticsService: GetCampaignAnalyticsService,
    private readonly getCampaignSourceAnalyticsService: GetCampaignSourceAnalyticsService,
  ) {}

  @Get(':campaignId/analytics')
  @Version('1')
  @ApiOperation({ summary: 'Get campaign performance summary' })
  @ApiOkResponse({ type: CampaignAnalyticsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Not business manager' })
  @ApiNotFoundResponse({ description: 'Campaign not found' })
  async getCampaignAnalytics(
    @Param('campaignId') campaignId: string,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ): Promise<CampaignAnalyticsResponseDto> {
    return this.getCampaignAnalyticsService.execute(campaignId, actor);
  }

  @Get(':campaignId/analytics/sources')
  @Version('1')
  @ApiOperation({ summary: 'Get campaign performance by source' })
  @ApiOkResponse({ type: [SourceAnalyticsResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Not business manager' })
  @ApiNotFoundResponse({ description: 'Campaign not found' })
  async getCampaignSourceAnalytics(
    @Param('campaignId') campaignId: string,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ): Promise<SourceAnalyticsResponseDto[]> {
    return this.getCampaignSourceAnalyticsService.execute(campaignId, actor);
  }
}

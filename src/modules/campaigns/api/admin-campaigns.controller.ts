import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PlatformRoles } from '../../../common/decorators/platform-roles.decorator';
import { AuthenticatedPrincipal } from '../../../common/types/authenticated-principal';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { PlatformRoleGuard } from '../../auth/infrastructure/guards/platform-role.guard';
import { AdminCampaignsService } from '../application/admin-campaigns.service';
import { ListCampaignsQueryDto } from './dto/campaign.query';
import {
  CampaignDetailsResponseDto,
  CampaignPageResponseDto,
} from './dto/campaign.response';
import { ReviewReasonRequestDto } from './dto/review-reason.request';

@ApiTags('Admin Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlatformRoleGuard)
@PlatformRoles('ADMIN')
@Controller('admin/campaigns')
export class AdminCampaignsController {
  constructor(private readonly adminCampaignsService: AdminCampaignsService) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'List campaigns for moderation' })
  @ApiQuery({
    name: 'status',
    required: false,
    example: 'PENDING_REVIEW',
    description: 'Optional moderation filter. For happy path use PENDING_REVIEW.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiOkResponse({ type: CampaignPageResponseDto })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  list(@Query() query: ListCampaignsQueryDto) {
    return this.adminCampaignsService.list(query);
  }

  @Get(':campaignId')
  @Version('1')
  @ApiOperation({ summary: 'Get campaign review details' })
  @ApiParam({
    name: 'campaignId',
    example: '11111111-1111-4111-8111-111111111111',
    description: 'Campaign UUID returned from the admin campaigns list.',
  })
  @ApiOkResponse({ type: CampaignDetailsResponseDto })
  @ApiNotFoundResponse({ description: 'Campaign not found' })
  getById(@Param('campaignId') campaignId: string) {
    return this.adminCampaignsService.getById(campaignId);
  }

  @Post(':campaignId/approve')
  @Version('1')
  @ApiOperation({ summary: 'Approve a pending campaign' })
  @ApiParam({
    name: 'campaignId',
    example: '11111111-1111-4111-8111-111111111111',
    description: 'Pending-review campaign UUID returned from the admin campaigns list.',
  })
  @ApiOkResponse({ type: CampaignDetailsResponseDto })
  @ApiConflictResponse({ description: 'Campaign cannot be approved' })
  approve(
    @Param('campaignId') campaignId: string,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.adminCampaignsService.approve(campaignId, actor);
  }

  @Post(':campaignId/reject')
  @Version('1')
  @ApiOperation({ summary: 'Reject a pending campaign' })
  @ApiParam({
    name: 'campaignId',
    example: '11111111-1111-4111-8111-111111111111',
    description: 'Pending-review campaign UUID returned from the admin campaigns list.',
  })
  @ApiBody({ type: ReviewReasonRequestDto })
  @ApiOkResponse({ type: CampaignDetailsResponseDto })
  @ApiConflictResponse({ description: 'Campaign cannot be rejected' })
  reject(
    @Param('campaignId') campaignId: string,
    @Body() body: ReviewReasonRequestDto,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.adminCampaignsService.reject(campaignId, body, actor);
  }

  @Post(':campaignId/suspend')
  @Version('1')
  @ApiOperation({ summary: 'Suspend a published campaign' })
  @ApiParam({
    name: 'campaignId',
    example: '11111111-1111-4111-8111-111111111111',
    description: 'Published campaign UUID returned from admin list or detail.',
  })
  @ApiBody({ type: ReviewReasonRequestDto })
  @ApiOkResponse({ type: CampaignDetailsResponseDto })
  @ApiConflictResponse({ description: 'Campaign cannot be suspended' })
  suspend(
    @Param('campaignId') campaignId: string,
    @Body() body: ReviewReasonRequestDto,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.adminCampaignsService.suspend(campaignId, body, actor);
  }

  @Post(':campaignId/reactivate')
  @Version('1')
  @ApiOperation({ summary: 'Reactivate a suspended campaign if still valid' })
  @ApiParam({
    name: 'campaignId',
    example: '11111111-1111-4111-8111-111111111111',
    description: 'Suspended campaign UUID returned from admin list or detail.',
  })
  @ApiOkResponse({ type: CampaignDetailsResponseDto })
  @ApiConflictResponse({ description: 'Campaign cannot be reactivated' })
  reactivate(
    @Param('campaignId') campaignId: string,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.adminCampaignsService.reactivate(campaignId, actor);
  }
}

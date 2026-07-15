import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedPrincipal } from '../../../common/types/authenticated-principal';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { BusinessCampaignsService } from '../application/business-campaigns.service';
import { CreateCampaignRequestDto, UpdateCampaignRequestDto } from './dto/campaign.request';
import { ListCampaignsQueryDto } from './dto/campaign.query';
import {
  CampaignDetailsResponseDto,
  CampaignPageResponseDto,
} from './dto/campaign.response';

@ApiTags('Business Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('business/campaigns')
export class BusinessCampaignsController {
  constructor(
    private readonly businessCampaignsService: BusinessCampaignsService,
  ) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'List current business campaigns' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: CampaignPageResponseDto })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Owner access required' })
  list(
    @Query() query: ListCampaignsQueryDto,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.businessCampaignsService.list(actor, query);
  }

  @Post()
  @Version('1')
  @ApiOperation({ summary: 'Create campaign draft' })
  @ApiBody({ type: CreateCampaignRequestDto })
  @ApiCreatedResponse({ type: CampaignDetailsResponseDto })
  @ApiConflictResponse({ description: 'Campaign slug conflict' })
  create(
    @Body() body: CreateCampaignRequestDto,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.businessCampaignsService.create(body, actor);
  }

  @Get(':campaignId')
  @Version('1')
  @ApiOperation({ summary: 'Get business campaign' })
  @ApiOkResponse({ type: CampaignDetailsResponseDto })
  @ApiNotFoundResponse({ description: 'Campaign not found' })
  getById(
    @Param('campaignId', new ParseUUIDPipe({ version: '4' })) campaignId: string,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.businessCampaignsService.getById(campaignId, actor);
  }

  @Patch(':campaignId')
  @Version('1')
  @ApiOperation({ summary: 'Update draft or rejected campaign' })
  @ApiBody({ type: UpdateCampaignRequestDto })
  @ApiOkResponse({ type: CampaignDetailsResponseDto })
  @ApiConflictResponse({ description: 'Campaign not editable or slug conflict' })
  update(
    @Param('campaignId', new ParseUUIDPipe({ version: '4' })) campaignId: string,
    @Body() body: UpdateCampaignRequestDto,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.businessCampaignsService.update(campaignId, body, actor);
  }

  @Post(':campaignId/submit')
  @Version('1')
  @ApiOperation({ summary: 'Submit campaign for admin review' })
  @ApiOkResponse({ type: CampaignDetailsResponseDto })
  @ApiConflictResponse({ description: 'Campaign cannot be submitted' })
  submit(
    @Param('campaignId', new ParseUUIDPipe({ version: '4' })) campaignId: string,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.businessCampaignsService.submit(campaignId, actor);
  }

  @Post(':campaignId/withdraw')
  @Version('1')
  @ApiOperation({ summary: 'Withdraw pending campaign back to draft' })
  @ApiOkResponse({ type: CampaignDetailsResponseDto })
  @ApiConflictResponse({ description: 'Campaign cannot be withdrawn' })
  withdraw(
    @Param('campaignId', new ParseUUIDPipe({ version: '4' })) campaignId: string,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.businessCampaignsService.withdraw(campaignId, actor);
  }
}

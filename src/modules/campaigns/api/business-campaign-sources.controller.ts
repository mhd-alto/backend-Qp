import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
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
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedPrincipal } from '../../../common/types/authenticated-principal';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { CampaignSourcesService } from '../application/campaign-sources.service';
import {
  CreateCampaignSourceRequestDto,
  SourceStatusRequestDto,
} from './dto/campaign-source.request';
import { CampaignSourceResponseDto } from './dto/campaign.response';

@ApiTags('Campaign Sources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('business/campaigns/:campaignId/sources')
export class BusinessCampaignSourcesController {
  constructor(private readonly campaignSourcesService: CampaignSourcesService) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'List campaign sources' })
  @ApiOkResponse({ type: CampaignSourceResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Owner access required' })
  @ApiNotFoundResponse({ description: 'Campaign not found' })
  list(
    @Param('campaignId', new ParseUUIDPipe({ version: '4' })) campaignId: string,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.campaignSourcesService.list(campaignId, actor);
  }

  @Post()
  @Version('1')
  @ApiOperation({ summary: 'Create a custom tracking source' })
  @ApiBody({ type: CreateCampaignSourceRequestDto })
  @ApiCreatedResponse({ type: CampaignSourceResponseDto })
  @ApiConflictResponse({ description: 'Duplicate source label' })
  create(
    @Param('campaignId', new ParseUUIDPipe({ version: '4' })) campaignId: string,
    @Body() body: CreateCampaignSourceRequestDto,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.campaignSourcesService.create(campaignId, body, actor);
  }

  @Patch(':sourceId/status')
  @Version('1')
  @ApiOperation({ summary: 'Activate or deactivate a custom source' })
  @ApiBody({ type: SourceStatusRequestDto })
  @ApiOkResponse({ type: CampaignSourceResponseDto })
  @ApiConflictResponse({ description: 'System source cannot be changed' })
  changeStatus(
    @Param('campaignId', new ParseUUIDPipe({ version: '4' })) campaignId: string,
    @Param('sourceId', new ParseUUIDPipe({ version: '4' })) sourceId: string,
    @Body() body: SourceStatusRequestDto,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ) {
    return this.campaignSourcesService.changeStatus(
      campaignId,
      sourceId,
      body,
      actor,
    );
  }
}

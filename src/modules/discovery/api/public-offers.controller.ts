import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedPrincipal } from '../../../common/types/authenticated-principal';
import { GetPublicOfferService } from '../application/get-public-offer/get-public-offer.service';
import { ListPublicOffersService } from '../application/list-public-offers/list-public-offers.service';
import { RecordCampaignVisitService } from '../application/record-campaign-visit/record-campaign-visit.service';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import { GetPublicOfferQueryDto, GetPublicOfferSlugParamDto, ListPublicOffersQueryDto } from './dto/public-offer.query';
import { OfferDetailsWithReasonResponseDto } from './dto/public-offer-detail.response';
import {
  OfferPageResponseDto,
  RecordVisitResponseDto,
} from './dto/public-offer.response';
import { RecordVisitRequestDto } from './dto/record-visit.request';

@ApiTags('Public Offers')
@Controller('public/offers')
export class PublicOffersController {
  constructor(
    private readonly listPublicOffersService: ListPublicOffersService,
    private readonly getPublicOfferService: GetPublicOfferService,
    private readonly recordCampaignVisitService: RecordCampaignVisitService,
  ) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'Browse and search public offers' })
  @ApiQuery({ name: 'q', required: false, type: String, example: 'pizza' })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    example: 'restaurants',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiOkResponse({ type: OfferPageResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error' })
  list(@Query() query: ListPublicOffersQueryDto): Promise<OfferPageResponseDto> {
    return this.listPublicOffersService.list(query);
  }

  @Get(':slug')
  @Version('1')
  @ApiOperation({ summary: 'Get public offer details' })
  @ApiParam({
    name: 'slug',
    example: 'damascus-pizza-july-offer',
    description: 'Public campaign slug returned by GET /public/offers.',
  })
  @ApiQuery({
    name: 'src',
    required: false,
    type: String,
    example: 'fb_damascus_july_2026',
  })
  @ApiOkResponse({ type: OfferDetailsWithReasonResponseDto })
  @ApiNotFoundResponse({ description: 'Offer not found' })
  getBySlug(
    @Param() params: GetPublicOfferSlugParamDto,
    @Query() query: GetPublicOfferQueryDto,
  ): Promise<OfferDetailsWithReasonResponseDto> {
    return this.getPublicOfferService.getBySlug(params.slug, query.src);
  }

  @Post(':campaignId/visits')
  @Version('1')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Record an offer visit and resolve source' })
  @ApiParam({
    name: 'campaignId',
    example: '11111111-1111-4111-8111-111111111111',
    description: 'Campaign UUID returned by GET /public/offers or the offer detail payload.',
  })
  @ApiCreatedResponse({ type: RecordVisitResponseDto })
  @ApiNotFoundResponse({ description: 'Campaign not found' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  recordVisit(
    @Param('campaignId', new ParseUUIDPipe({ version: '4' })) campaignId: string,
    @Body() body: RecordVisitRequestDto = new RecordVisitRequestDto(),
    @CurrentUser() actor: AuthenticatedPrincipal | null,
  ): Promise<RecordVisitResponseDto> {
    return this.recordCampaignVisitService.record(campaignId, body, actor);
  }
}

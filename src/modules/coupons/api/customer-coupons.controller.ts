import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UseGuards,
  Version,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedPrincipal } from '../../../common/types/authenticated-principal';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { CustomerCouponsService } from '../application/customer-coupons.service';
import { ClaimCouponRequestDto } from './dto/coupon.request';
import { ListMyCouponsQueryDto } from './dto/coupon.query';
import {
  CouponDetailsResponseDto,
  CouponPageResponseDto,
} from './dto/coupon.response';

@ApiTags('Customer Coupons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class CustomerCouponsController {
  constructor(
    private readonly customerCouponsService: CustomerCouponsService,
  ) {}

  @Post('customer/campaigns/:campaignId/coupons')
  @Version('1')
  @ApiOperation({ summary: 'Claim or return the existing customer coupon' })
  @ApiParam({
    name: 'campaignId',
    example: '11111111-1111-4111-8111-111111111111',
    description:
      'Campaign UUID from the public offers list or the public offer detail response.',
  })
  @ApiCreatedResponse({ type: CouponDetailsResponseDto })
  @ApiOkResponse({ type: CouponDetailsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiNotFoundResponse({ description: 'Campaign not found' })
  @ApiConflictResponse({
    description: 'Campaign not claimable, sold out, or coupon already exists',
  })
  async claim(
    @Param('campaignId', new ParseUUIDPipe({ version: '4' })) campaignId: string,
    @Body() body: ClaimCouponRequestDto = new ClaimCouponRequestDto(),
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CouponDetailsResponseDto> {
    const result = await this.customerCouponsService.claim(campaignId, body, actor);
    response.status(result.statusCode);
    response.setHeader('Cache-Control', 'no-store, private');
    return result.coupon;
  }

  @Get('customer/coupons')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List current customer coupons' })
  @ApiOkResponse({ type: CouponPageResponseDto })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async list(
    @Query() query: ListMyCouponsQueryDto,
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CouponPageResponseDto> {
    response.setHeader('Cache-Control', 'no-store, private');
    return this.customerCouponsService.list(actor, query);
  }

  @Get('customer/coupons/:couponId')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a customer-owned coupon' })
  @ApiParam({
    name: 'couponId',
    example: '22222222-2222-4222-8222-222222222222',
    description: 'Coupon UUID returned by POST /customer/campaigns/{campaignId}/coupons or GET /customer/coupons.',
  })
  @ApiOkResponse({ type: CouponDetailsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Coupon does not belong to current user' })
  @ApiNotFoundResponse({ description: 'Coupon not found' })
  async getById(
    @Param('couponId', new ParseUUIDPipe({ version: '4' })) couponId: string,
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CouponDetailsResponseDto> {
    response.setHeader('Cache-Control', 'no-store, private');
    return this.customerCouponsService.getById(couponId, actor);
  }
}

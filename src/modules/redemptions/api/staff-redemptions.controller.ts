import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
  Version,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
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
import { AuthenticatedPrincipal } from '../../../common/types/authenticated-principal';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { ValidateCouponService } from '../application/validate-coupon/validate-coupon.service';
import { RedeemCouponService } from '../application/redeem-coupon/redeem-coupon.service';
import { ListStaffRedemptionsService } from '../application/list-staff-redemptions/list-staff-redemptions.service';
import { ValidateCouponRequestDto } from './dto/validate-coupon.request';
import { ValidationResultResponseDto } from './dto/validation-result.response';
import { ListStaffRedemptionsQueryDto } from './dto/list-staff-redemptions.query';
import {
  RedemptionResponseDto,
  RedemptionPageResponseDto,
} from './dto/redemption.response';
import { RedeemCouponRequestDto } from './dto/redeem-coupon.request';

@ApiTags('Staff Redemptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('staff')
export class StaffRedemptionsController {
  constructor(
    private readonly validateCouponService: ValidateCouponService,
    private readonly redeemCouponService: RedeemCouponService,
    private readonly listStaffRedemptionsService: ListStaffRedemptionsService,
  ) {}

  @Post('coupons/validate')
  @Version('1')
  @ApiOperation({ summary: 'Validate a coupon without consuming it' })
  @ApiBody({ type: ValidateCouponRequestDto })
  @ApiOkResponse({ type: ValidationResultResponseDto })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async validateCoupon(
    @Body() body: ValidateCouponRequestDto,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ): Promise<ValidationResultResponseDto> {
    if ((!body.code && !body.qrToken) || (body.code && body.qrToken)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: {
          ar: 'يجب إدخال الرمز أو رمز الاستجابة السريعة (QR) فقط.',
          en: 'Exactly one of qrToken or code must be provided.',
        },
      });
    }
    return this.validateCouponService.execute(body, actor);
  }

  @Post('coupons/:couponId/redeem')
  @Version('1')
  @ApiOperation({ summary: 'Confirm coupon redemption atomically' })
  @ApiParam({ name: 'couponId', example: 'd1c01e35-515a-4b05-9f5b-9d41334c9c22', description: 'Coupon UUID' })
  @ApiBody({ type: RedeemCouponRequestDto })
  @ApiCreatedResponse({ type: RedemptionResponseDto })
  @ApiOkResponse({ type: RedemptionResponseDto })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  @ApiForbiddenResponse({ description: 'Invalid staff context' })
  @ApiNotFoundResponse({ description: 'Coupon not found' })
  async redeemCoupon(
    @Param('couponId') couponId: string,
    @Body() body: RedeemCouponRequestDto,
    @CurrentUser() actor: AuthenticatedPrincipal,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RedemptionResponseDto> {
    const result = await this.redeemCouponService.execute(couponId, body, actor);
    if (result.existing) {
      res.status(HttpStatus.OK);
    } else {
      res.status(HttpStatus.CREATED);
    }
    return result.redemption;
  }

  @Get('redemptions')
  @Version('1')
  @ApiOperation({ summary: 'List current staff redemption history' })
  @ApiOkResponse({ type: RedemptionPageResponseDto })
  @ApiUnauthorizedResponse({ description: 'Authentication required' })
  async listStaffRedemptions(
    @Query() query: ListStaffRedemptionsQueryDto,
    @CurrentUser() actor: AuthenticatedPrincipal,
  ): Promise<RedemptionPageResponseDto> {
    return this.listStaffRedemptionsService.execute(actor, query);
  }
}

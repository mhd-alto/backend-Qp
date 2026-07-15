import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Version,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiAcceptedResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { ForgotPasswordService } from '../application/forgot-password/forgot-password.service';
import { LoginService } from '../application/login/login.service';
import { LogoutService } from '../application/logout/logout.service';
import { RefreshSessionService } from '../application/refresh-session/refresh-session.service';
import { RegisterService } from '../application/register/register.service';
import { ResetPasswordService } from '../application/reset-password/reset-password.service';
import { AuthResponseDto } from './dto/auth-tokens.response';
import { ForgotPasswordRequestDto } from './dto/forgot-password.request';
import { ForgotPasswordResponseDto } from './dto/forgot-password.response';
import { LoginRequestDto } from './dto/login.request';
import { LogoutRequestDto } from './dto/logout.request';
import { RefreshTokenRequestDto } from './dto/refresh-token.request';
import { RegisterRequestDto } from './dto/register.request';
import { ResetPasswordRequestDto } from './dto/reset-password.request';
import { AuthTokensResponseDto } from './dto/auth-tokens.response';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerService: RegisterService,
    private readonly loginService: LoginService,
    private readonly refreshSessionService: RefreshSessionService,
    private readonly logoutService: LogoutService,
    private readonly forgotPasswordService: ForgotPasswordService,
    private readonly resetPasswordService: ResetPasswordService,
  ) {}

  @Post('register')
  @Version('1')
  @ApiOperation({ summary: 'Register a customer account' })
  @ApiBody({ type: RegisterRequestDto })
  @ApiCreatedResponse({
    description: 'Customer registered successfully',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Validation error' })
  @ApiConflictResponse({ description: 'Email or phone already in use' })
  async register(
    @Body() body: RegisterRequestDto,
    @Req() request: Request,
  ): Promise<AuthResponseDto> {
    return this.registerService.execute(body, request);
  }

  @Post('login')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with email or phone and password' })
  @ApiBody({ type: LoginRequestDto })
  @ApiOkResponse({
    description: 'Authenticated successfully',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials or inactive account' })
  async login(
    @Body() body: LoginRequestDto,
    @Req() request: Request,
  ): Promise<AuthResponseDto> {
    return this.loginService.execute(body, request);
  }

  @Post('refresh')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh an authentication session' })
  @ApiBody({ type: RefreshTokenRequestDto })
  @ApiOkResponse({
    description: 'Tokens refreshed successfully',
    type: AuthTokensResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token' })
  async refresh(
    @Body() body: RefreshTokenRequestDto,
  ): Promise<AuthTokensResponseDto> {
    return this.refreshSessionService.execute(body);
  }

  @Post('logout')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke current refresh session' })
  @ApiBody({ type: LogoutRequestDto })
  @ApiNoContentResponse({ description: 'Session revoked successfully' })
  async logout(@Body() body: LogoutRequestDto): Promise<void> {
    await this.logoutService.execute(body);
  }

  @Post('forgot-password')
  @Version('1')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiBody({ type: ForgotPasswordRequestDto })
  @ApiAcceptedResponse({
    description: 'Request accepted regardless of account existence',
    type: ForgotPasswordResponseDto,
  })
  async forgotPassword(
    @Body() body: ForgotPasswordRequestDto,
  ): Promise<ForgotPasswordResponseDto> {
    return this.forgotPasswordService.execute(body);
  }

  @Post('reset-password')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reset password using a single-use token' })
  @ApiBody({ type: ResetPasswordRequestDto })
  @ApiNoContentResponse({ description: 'Password reset successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired reset token' })
  async resetPassword(@Body() body: ResetPasswordRequestDto): Promise<void> {
    await this.resetPasswordService.execute(body);
  }
}

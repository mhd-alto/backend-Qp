import { createHash, randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ForgotPasswordRequestDto } from '../../api/dto/forgot-password.request';
import { ForgotPasswordResponseDto } from '../../api/dto/forgot-password.response';
import { IDENTITY_READER, USER_STATUS_READER } from '../../../identity/contracts/identity.tokens';
import { IdentityReader } from '../../../identity/contracts/identity-reader';
import { UserStatusReader } from '../../../identity/contracts/user-status-reader';
import {
  PASSWORD_RESET_TOKEN_REPOSITORY,
  PasswordResetTokenRepository,
} from '../../domain/repositories/password-reset-token.repository';

@Injectable()
export class ForgotPasswordService {
  private readonly logger = new Logger(ForgotPasswordService.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject(IDENTITY_READER)
    private readonly identityReader: IdentityReader,
    @Inject(USER_STATUS_READER)
    private readonly userStatusReader: UserStatusReader,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
  ) {}

  async execute(
    input: ForgotPasswordRequestDto,
  ): Promise<ForgotPasswordResponseDto> {
    const identity = await this.identityReader.findByIdentifier(input.identifier);
    const response = this.baseResponse();

    if (!identity || !this.userStatusReader.isActiveForAuthentication(identity.status)) {
      return response;
    }

    const token = randomUUID();
    await this.passwordResetTokenRepository.create({
      userId: identity.id,
      tokenHash: this.hashToken(token),
      expiresAt: this.createExpiryDate(),
    });

    if (this.isDevelopment()) {
      this.logger.log(
        `Development password reset token for user ${identity.id}: ${token}`,
      );

      return {
        ...response,
        resetToken: token,
      };
    }

    return response;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private createExpiryDate(): Date {
    const ttl = this.configService.get<string>('auth.passwordResetTtl') ?? '15m';
    const seconds = this.parseTtlToSeconds(ttl);
    return new Date(Date.now() + seconds * 1000);
  }

  private parseTtlToSeconds(value: string): number {
    if (/^\d+$/.test(value)) {
      return Number(value);
    }

    const match = /^(\d+)(s|m|h|d)$/.exec(value.trim());

    if (!match) {
      return 15 * 60;
    }

    const amount = Number(match[1]);
    const unit = match[2] as 's' | 'm' | 'h' | 'd';
    const unitToSeconds = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    } as const;

    return amount * unitToSeconds[unit];
  }

  private isDevelopment(): boolean {
    return (this.configService.get<string>('NODE_ENV') ?? 'development') === 'development';
  }

  private baseResponse(): ForgotPasswordResponseDto {
    return {
      message: 'If the account exists, reset instructions have been prepared.',
      resetToken: null,
    };
  }
}

import { createHash } from 'node:crypto';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FRIENDLY_MESSAGES } from '../../../../common/constants/localized-messages';
import { ResetPasswordRequestDto } from '../../api/dto/reset-password.request';
import {
  AUTH_SESSION_REPOSITORY,
  AuthSessionRepository,
} from '../../domain/repositories/auth-session.repository';
import {
  PASSWORD_RESET_TOKEN_REPOSITORY,
  PasswordResetTokenRepository,
} from '../../domain/repositories/password-reset-token.repository';
import { IDENTITY_READER } from '../../../identity/contracts/identity.tokens';
import { IdentityReader } from '../../../identity/contracts/identity-reader';
import { PASSWORD_HASHER, PasswordHasher } from '../../domain/services/password-hasher';
import { USER_REPOSITORY, UserRepository } from '../../../identity/domain/repositories/user.repository';

@Injectable()
export class ResetPasswordService {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(IDENTITY_READER)
    private readonly identityReader: IdentityReader,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: ResetPasswordRequestDto): Promise<void> {
    const tokenHash = this.hashToken(input.token);
    const resetToken = await this.passwordResetTokenRepository.findActiveByTokenHash(
      tokenHash,
    );

    if (!resetToken || resetToken.expiresAt <= new Date()) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: FRIENDLY_MESSAGES.INVALID_CREDENTIALS,
      });
    }

    const identity = await this.identityReader.findById(resetToken.userId);

    if (!identity) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: FRIENDLY_MESSAGES.INVALID_CREDENTIALS,
      });
    }

    await this.dataSource.transaction(async (manager) => {
      await this.userRepository.updatePasswordHash(
        identity.id,
        await this.passwordHasher.hash(input.newPassword),
        manager,
      );
      await this.passwordResetTokenRepository.markUsed(
        resetToken.id,
        new Date(),
        manager,
      );
      await this.authSessionRepository.revokeAllByUserId(
        identity.id,
        'PASSWORD_RESET',
        manager,
      );
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

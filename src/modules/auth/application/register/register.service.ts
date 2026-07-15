import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { AuthResponseDto } from '../../api/dto/auth-tokens.response';
import { RegisterRequestDto } from '../../api/dto/register.request';
import {
  AUTH_SESSION_REPOSITORY,
  AuthSessionRepository,
} from '../../domain/repositories/auth-session.repository';
import { IDENTITY_ACCOUNT_CREATOR } from '../../../identity/contracts/identity.tokens';
import { IdentityAccountCreator } from '../../../identity/contracts/identity-account-creator';
import {
  PASSWORD_HASHER,
  PasswordHasher,
} from '../../domain/services/password-hasher';
import {
  TOKEN_SERVICE,
  TokenService,
} from '../../domain/services/token-service';

@Injectable()
export class RegisterService {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepository,
    @Inject(IDENTITY_ACCOUNT_CREATOR)
    private readonly identityAccountCreator: IdentityAccountCreator,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async execute(
    input: RegisterRequestDto,
    request: Request,
  ): Promise<AuthResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const passwordHash = await this.passwordHasher.hash(input.password);
      const user = await this.identityAccountCreator.createCustomerAccount(
        {
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          passwordHash,
          policyVersion: input.policyVersion ?? 'mvp-v0.2',
        },
        manager,
      );

      const sessionId = randomUUID();
      const refreshToken = this.tokenService.issueRefreshToken({
        userId: user.id,
        sessionId,
      });

      await this.authSessionRepository.create(
        {
          id: sessionId,
          userId: user.id,
          refreshTokenHash: await this.passwordHasher.hash(refreshToken.token),
          userAgent: this.getUserAgent(request),
          ipHash: null,
          expiresAt: refreshToken.expiresAt,
          lastUsedAt: new Date(),
        },
        manager,
      );

      const accessToken = this.tokenService.issueAccessToken({
        userId: user.id,
        platformRole: user.platformRole,
        status: user.status,
      });

      return {
        user,
        tokens: {
          accessToken: accessToken.token,
          refreshToken: refreshToken.token,
          accessTokenExpiresIn: accessToken.expiresInSeconds,
        },
      };
    });
  }

  private getUserAgent(request: Request): string | null {
    return typeof request.headers['user-agent'] === 'string'
      ? request.headers['user-agent']
      : null;
  }
}

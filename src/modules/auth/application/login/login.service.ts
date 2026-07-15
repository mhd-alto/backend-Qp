import {
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Request } from 'express';
import { FRIENDLY_MESSAGES } from '../../../../common/constants/localized-messages';
import { LoginRequestDto } from '../../api/dto/login.request';
import { AuthResponseDto } from '../../api/dto/auth-tokens.response';
import {
  AUTH_SESSION_REPOSITORY,
  AuthSessionRepository,
} from '../../domain/repositories/auth-session.repository';
import { IDENTITY_READER, USER_STATUS_READER } from '../../../identity/contracts/identity.tokens';
import { IdentityReader } from '../../../identity/contracts/identity-reader';
import { UserStatusReader } from '../../../identity/contracts/user-status-reader';
import {
  PASSWORD_HASHER,
  PasswordHasher,
} from '../../domain/services/password-hasher';
import {
  TOKEN_SERVICE,
  TokenService,
} from '../../domain/services/token-service';

@Injectable()
export class LoginService {
  constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepository,
    @Inject(IDENTITY_READER)
    private readonly identityReader: IdentityReader,
    @Inject(USER_STATUS_READER)
    private readonly userStatusReader: UserStatusReader,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async execute(
    input: LoginRequestDto,
    request: Request,
  ): Promise<AuthResponseDto> {
    const identity = await this.identityReader.findByIdentifier(input.identifier);

    if (!identity) {
      throw this.invalidCredentials();
    }

    if (!this.userStatusReader.isActiveForAuthentication(identity.status)) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_NOT_ACTIVE',
        message: FRIENDLY_MESSAGES.ACCOUNT_NOT_ACTIVE,
      });
    }

    const passwordMatches = await this.passwordHasher.verify(
      input.password,
      identity.passwordHash,
    );

    if (!passwordMatches) {
      throw this.invalidCredentials();
    }

    const sessionId = randomUUID();
    const refreshToken = this.tokenService.issueRefreshToken({
      userId: identity.id,
      sessionId,
    });

    await this.authSessionRepository.create({
      id: sessionId,
      userId: identity.id,
      refreshTokenHash: await this.passwordHasher.hash(refreshToken.token),
      userAgent: this.getUserAgent(request),
      ipHash: null,
      expiresAt: refreshToken.expiresAt,
      lastUsedAt: new Date(),
    });

    const accessToken = this.tokenService.issueAccessToken({
      userId: identity.id,
      platformRole: identity.platformRole,
      status: identity.status,
    });

    await this.identityReader.markLoginSuccess(identity.id);

    return {
      user: {
        id: identity.id,
        fullName: identity.fullName,
        email: identity.email,
        phone: identity.phone,
        platformRole: identity.platformRole,
        status: identity.status,
      },
      tokens: {
        accessToken: accessToken.token,
        refreshToken: refreshToken.token,
        accessTokenExpiresIn: accessToken.expiresInSeconds,
      },
    };
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException({
      code: 'INVALID_CREDENTIALS',
      message: FRIENDLY_MESSAGES.INVALID_CREDENTIALS,
    });
  }

  private getUserAgent(request: Request): string | null {
    return typeof request.headers['user-agent'] === 'string'
      ? request.headers['user-agent']
      : null;
  }
}

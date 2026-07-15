import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { FRIENDLY_MESSAGES } from '../../../../common/constants/localized-messages';
import {
  AUTH_SESSION_REPOSITORY,
  AuthSessionRepository,
} from '../../domain/repositories/auth-session.repository';
import { RefreshTokenRequestDto } from '../../api/dto/refresh-token.request';
import { AuthTokensResponseDto } from '../../api/dto/auth-tokens.response';
import { IDENTITY_READER, USER_STATUS_READER } from '../../../identity/contracts/identity.tokens';
import { IdentityReader } from '../../../identity/contracts/identity-reader';
import { UserStatusReader } from '../../../identity/contracts/user-status-reader';
import { PASSWORD_HASHER, PasswordHasher } from '../../domain/services/password-hasher';
import { TOKEN_SERVICE, TokenService } from '../../domain/services/token-service';

@Injectable()
export class RefreshSessionService {
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

  async execute(input: RefreshTokenRequestDto): Promise<AuthTokensResponseDto> {
    const payload = this.tokenService.verifyRefreshToken(input.refreshToken);
    const session = await this.authSessionRepository.findActiveById(payload.sid);

    if (!session || session.userId !== payload.sub || session.expiresAt <= new Date()) {
      throw this.invalidCredentials();
    }

    const tokenMatches = await this.passwordHasher.verify(
      input.refreshToken,
      session.refreshTokenHash,
    );

    if (!tokenMatches) {
      throw this.invalidCredentials();
    }

    const identity = await this.identityReader.findById(payload.sub);

    if (!identity || !this.userStatusReader.isActiveForAuthentication(identity.status)) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_NOT_ACTIVE',
        message: FRIENDLY_MESSAGES.ACCOUNT_NOT_ACTIVE,
      });
    }

    const nextRefreshToken = this.tokenService.issueRefreshToken({
      userId: identity.id,
      sessionId: session.id,
    });

    await this.authSessionRepository.update({
      id: session.id,
      refreshTokenHash: await this.passwordHasher.hash(nextRefreshToken.token),
      expiresAt: nextRefreshToken.expiresAt,
      lastUsedAt: new Date(),
    });

    const accessToken = this.tokenService.issueAccessToken({
      userId: identity.id,
      platformRole: identity.platformRole,
      status: identity.status,
    });

    return {
      accessToken: accessToken.token,
      refreshToken: nextRefreshToken.token,
      accessTokenExpiresIn: accessToken.expiresInSeconds,
    };
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException({
      code: 'INVALID_CREDENTIALS',
      message: FRIENDLY_MESSAGES.INVALID_CREDENTIALS,
    });
  }
}

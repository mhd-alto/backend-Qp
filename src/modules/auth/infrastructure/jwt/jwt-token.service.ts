import { createHmac } from 'node:crypto';
import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FRIENDLY_MESSAGES } from '../../../../common/constants/localized-messages';
import {
  AccessTokenPayload,
  IssuedAccessToken,
  IssuedRefreshToken,
  RefreshTokenPayload,
  TokenService,
} from '../../domain/services/token-service';

type TokenPayload = Record<string, number | string>;

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly configService: ConfigService) {}

  issueAccessToken(input: {
    userId: string;
    platformRole: string;
    status: string;
  }): IssuedAccessToken {
    const expiresInSeconds = this.parseTtl(
      this.configService.get<string>('auth.accessTtl') ?? '15m',
    );
    const nowInSeconds = this.nowInSeconds();

    const payload: AccessTokenPayload = {
      sub: input.userId,
      role: input.platformRole,
      status: input.status,
      type: 'access',
      iat: nowInSeconds,
      exp: nowInSeconds + expiresInSeconds,
    };

    return {
      token: this.sign(payload, this.getRequiredSecret('auth.accessSecret')),
      expiresInSeconds,
    };
  }

  issueRefreshToken(input: {
    userId: string;
    sessionId: string;
  }): IssuedRefreshToken {
    const expiresInSeconds = this.parseTtl(
      this.configService.get<string>('auth.refreshTtl') ?? '30d',
    );
    const nowInSeconds = this.nowInSeconds();

    const payload: RefreshTokenPayload = {
      sub: input.userId,
      sid: input.sessionId,
      type: 'refresh',
      iat: nowInSeconds,
      exp: nowInSeconds + expiresInSeconds,
    };

    return {
      token: this.sign(payload, this.getRequiredSecret('auth.refreshSecret')),
      expiresAt: new Date((nowInSeconds + expiresInSeconds) * 1000),
    };
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    return this.verifyToken<RefreshTokenPayload>(
      token,
      this.getRequiredSecret('auth.refreshSecret'),
      'refresh',
    );
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    return this.verifyToken<AccessTokenPayload>(
      token,
      this.getRequiredSecret('auth.accessSecret'),
      'access',
    );
  }

  private verifyToken<T extends { exp: number; type: string }>(
    token: string,
    secret: string,
    expectedType: string,
  ): T {
    const [encodedHeader, encodedPayload, signature] = token.split('.');

    if (!encodedHeader || !encodedPayload || !signature) {
      throw this.invalidToken();
    }

    const expectedSignature = this.createSignature(
      `${encodedHeader}.${encodedPayload}`,
      secret,
    );

    if (expectedSignature !== signature) {
      throw this.invalidToken();
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    ) as T;

    if (payload.type !== expectedType || payload.exp <= this.nowInSeconds()) {
      throw this.invalidToken();
    }

    return payload;
  }

  private sign(payload: TokenPayload, secret: string): string {
    const encodedHeader = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
      'utf8',
    ).toString('base64url');
    const encodedPayload = Buffer.from(
      JSON.stringify(payload),
      'utf8',
    ).toString('base64url');
    const signature = this.createSignature(
      `${encodedHeader}.${encodedPayload}`,
      secret,
    );

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private createSignature(content: string, secret: string): string {
    return createHmac('sha256', secret).update(content).digest('base64url');
  }

  private parseTtl(value: string): number {
    if (/^\d+$/.test(value)) {
      return Number(value);
    }

    const match = /^(\d+)(s|m|h|d)$/.exec(value.trim());

    if (!match) {
      throw new InternalServerErrorException({
        code: 'AUTH_SECRET_MISCONFIGURED',
        message: FRIENDLY_MESSAGES.AUTH_SECRET_MISCONFIGURED,
      });
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

  private getRequiredSecret(key: string): string {
    const secret = this.configService.get<string>(key);

    if (!secret) {
      throw new InternalServerErrorException({
        code: 'AUTH_SECRET_MISCONFIGURED',
        message: FRIENDLY_MESSAGES.AUTH_SECRET_MISCONFIGURED,
      });
    }

    return secret;
  }

  private invalidToken(): UnauthorizedException {
    return new UnauthorizedException({
      code: 'INVALID_CREDENTIALS',
      message: FRIENDLY_MESSAGES.INVALID_CREDENTIALS,
    });
  }

  private nowInSeconds(): number {
    return Math.floor(Date.now() / 1000);
  }
}

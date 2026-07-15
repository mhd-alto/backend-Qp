import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { FRIENDLY_MESSAGES } from '../../../../common/constants/localized-messages';
import { AuthenticatedPrincipal } from '../../../../common/types/authenticated-principal';
import { IDENTITY_READER, USER_STATUS_READER } from '../../../identity/contracts/identity.tokens';
import { IdentityReader } from '../../../identity/contracts/identity-reader';
import { UserStatusReader } from '../../../identity/contracts/user-status-reader';
import { TOKEN_SERVICE, TokenService } from '../../domain/services/token-service';

type RequestWithUser = Request & {
  user?: AuthenticatedPrincipal;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
    @Inject(IDENTITY_READER)
    private readonly identityReader: IdentityReader,
    @Inject(USER_STATUS_READER)
    private readonly userStatusReader: UserStatusReader,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractBearerToken(request);
    const payload = this.tokenService.verifyAccessToken(token);
    const identity = await this.identityReader.findById(payload.sub);

    if (!identity || !this.userStatusReader.isActiveForAuthentication(identity.status)) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_NOT_ACTIVE',
        message: FRIENDLY_MESSAGES.ACCOUNT_NOT_ACTIVE,
      });
    }

    request.user = {
      id: identity.id,
      fullName: identity.fullName,
      email: identity.email,
      phone: identity.phone,
      platformRole: identity.platformRole,
      status: identity.status,
    };

    return true;
  }

  private extractBearerToken(request: Request): string {
    const header = request.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: FRIENDLY_MESSAGES.INVALID_CREDENTIALS,
      });
    }

    return header.slice('Bearer '.length).trim();
  }
}

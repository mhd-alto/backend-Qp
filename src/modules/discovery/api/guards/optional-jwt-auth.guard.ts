import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedPrincipal } from '../../../../common/types/authenticated-principal';
import { IDENTITY_READER, USER_STATUS_READER } from '../../../identity/contracts/identity.tokens';
import { IdentityReader } from '../../../identity/contracts/identity-reader';
import { UserStatusReader } from '../../../identity/contracts/user-status-reader';
import { TOKEN_SERVICE, TokenService } from '../../../auth/domain/services/token-service';

type RequestWithUser = Request & {
  user?: AuthenticatedPrincipal;
};

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
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

    if (!token) {
      return true;
    }

    try {
      const payload = this.tokenService.verifyAccessToken(token);
      const identity = await this.identityReader.findById(payload.sub);

      if (!identity || !this.userStatusReader.isActiveForAuthentication(identity.status)) {
        return true;
      }

      request.user = {
        id: identity.id,
        fullName: identity.fullName,
        email: identity.email,
        phone: identity.phone,
        platformRole: identity.platformRole,
        status: identity.status,
      };
    } catch {
      return true;
    }

    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const header = request.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      return null;
    }

    return header.slice('Bearer '.length).trim() || null;
  }
}

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FRIENDLY_MESSAGES } from '../../../../common/constants/localized-messages';
import { PLATFORM_ROLES_KEY } from '../../../../common/decorators/platform-roles.decorator';
import { AuthenticatedPrincipal } from '../../../../common/types/authenticated-principal';

@Injectable()
export class PlatformRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(PLATFORM_ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedPrincipal }>();
    const principal = request.user;

    if (!principal || !requiredRoles.includes(principal.platformRole)) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: FRIENDLY_MESSAGES.FORBIDDEN,
      });
    }

    return true;
  }
}

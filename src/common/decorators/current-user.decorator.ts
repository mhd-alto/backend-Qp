import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedPrincipal } from '../types/authenticated-principal';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedPrincipal | null => {
    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedPrincipal }>();
    return request.user ?? null;
  },
);

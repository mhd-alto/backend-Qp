import { SetMetadata } from '@nestjs/common';

export const PLATFORM_ROLES_KEY = 'platform_roles';

export function PlatformRoles(...roles: string[]) {
  return SetMetadata(PLATFORM_ROLES_KEY, roles);
}

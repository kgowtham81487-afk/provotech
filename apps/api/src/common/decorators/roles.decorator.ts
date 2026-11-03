import { SetMetadata } from '@nestjs/common';
import { UserRoleType } from '@ees/shared';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRoleType[]) => SetMetadata(ROLES_KEY, roles);

import { Roles, type Role } from '@/lib/auth/roles';

export function hasAnyRole(role: Role, allowed: Role[]) {
  return allowed.includes(role);
}

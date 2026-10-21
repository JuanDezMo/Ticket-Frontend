export const ROLES = { USER: 'USER', ADMIN: 'ADMIN' } as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_VALUES: readonly string[] = [ROLES.USER, ROLES.ADMIN];

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && ROLE_VALUES.includes(value);
}

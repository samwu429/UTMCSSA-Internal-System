import type { RoleSummary } from '@/shared/api/contracts/organization/role'

export const PRESIDIUM_DEPARTMENT_SLUG = 'presidium'
export const PLATFORM_ADMIN_DEPARTMENT_SLUG = 'platform-admin'

export const DEPARTMENT_MEMBER_ROLE_KEY = 'department_member'
export const DEPARTMENT_DEPUTY_ROLE_KEY = 'department_deputy'
export const DEPARTMENT_DIRECTOR_ROLE_KEY = 'department_lead'
export const PRESIDIUM_PRESIDENT_ROLE_KEY = 'executive'
export const PRESIDIUM_SECRETARY_GENERAL_ROLE_KEY = 'presidium_secretary_general'
export const PRESIDIUM_INTERNAL_VP_ROLE_KEY = 'presidium_internal_vp'
export const PRESIDIUM_EXTERNAL_VP_ROLE_KEY = 'presidium_external_vp'
export const PLATFORM_ADMINISTRATOR_ROLE_KEY = 'platform_administrator'

export const DEPARTMENT_OFFICE_KEYS: readonly string[] = [
  DEPARTMENT_DIRECTOR_ROLE_KEY,
  DEPARTMENT_DEPUTY_ROLE_KEY,
  DEPARTMENT_MEMBER_ROLE_KEY,
]

export const PRESIDIUM_OFFICE_KEYS: readonly string[] = [
  PRESIDIUM_PRESIDENT_ROLE_KEY,
  PRESIDIUM_SECRETARY_GENERAL_ROLE_KEY,
  PRESIDIUM_INTERNAL_VP_ROLE_KEY,
  PRESIDIUM_EXTERNAL_VP_ROLE_KEY,
]

export const HIDDEN_ROLE_KEYS: readonly string[] = [
  PLATFORM_ADMINISTRATOR_ROLE_KEY,
  'department_officer',
]

export function officeKeysForDepartment(slug: string): readonly string[] {
  if (slug === PLATFORM_ADMIN_DEPARTMENT_SLUG) {
    return [PLATFORM_ADMINISTRATOR_ROLE_KEY]
  }
  if (slug === PRESIDIUM_DEPARTMENT_SLUG) {
    return PRESIDIUM_OFFICE_KEYS
  }
  return DEPARTMENT_OFFICE_KEYS
}

export function isPresidiumOffice(officeKey: string): boolean {
  return PRESIDIUM_OFFICE_KEYS.includes(officeKey)
}

export function rolesAssignableInDepartment(
  roles: readonly RoleSummary[],
  departmentSlug: string,
): RoleSummary[] {
  const allowed = new Set(officeKeysForDepartment(departmentSlug))
  return roles.filter((role) => role.key != null && allowed.has(role.key))
}

export function defaultRoleIdForDepartment(
  roles: readonly RoleSummary[],
  departmentSlug: string,
): string {
  const assignable = rolesAssignableInDepartment(roles, departmentSlug)
  const preferredKey =
    departmentSlug === PRESIDIUM_DEPARTMENT_SLUG
      ? PRESIDIUM_PRESIDENT_ROLE_KEY
      : DEPARTMENT_MEMBER_ROLE_KEY
  return assignable.find((role) => role.key === preferredKey)?.id ?? assignable[0]?.id ?? ''
}

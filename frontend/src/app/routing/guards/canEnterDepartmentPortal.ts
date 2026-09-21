import { ADMINISTRATION_PERMISSIONS } from '@/shared/authorization/permissionEvaluation'
import { Permission } from '@/shared/api/contracts/authorization/permissionIdentifiers'
import type { SessionProfile } from '@/shared/api/contracts/identity/sessionProfile'

const CROSS_DEPARTMENT_PERMISSIONS: readonly string[] = [
  Permission.DIRECTORY_VIEW_ALL_DEPARTMENTS,
  Permission.DOCUMENTS_VIEW_ALL_DEPARTMENTS,
  ...ADMINISTRATION_PERMISSIONS,
]

/**
 * Whether this account may open a given department portal.
 *
 * Members always enter their own department. Oversight accounts may also open another department's
 * address for supervision, but the page they see is still that department's portal, not a generic
 * admin skin over it.
 *
 * 判断账号能否打开指定部门门户。成员只能进入自己的部门；监管账号也可打开其他部门地址进行监管，
 * 但看到的仍是该部门自己的门户，而不是套在上面的通用管理皮肤。
 */
export function canEnterDepartmentPortal(profile: SessionProfile, departmentSlug: string): boolean {
  if (profile.memberships.some((membership) => membership.department_slug === departmentSlug)) {
    return true
  }

  return canOpenEveryDepartmentPortal(profile)
}

/**
 * Presidium and platform administrators may open any department's own frontend.
 *
 * 主席团与平台管理员可打开任意部门自己的前端。
 */
export function canOpenEveryDepartmentPortal(profile: SessionProfile): boolean {
  if (profile.primary_portal?.has_organization_oversight === true) {
    return true
  }

  return CROSS_DEPARTMENT_PERMISSIONS.some((permission) => profile.permissions.includes(permission))
}

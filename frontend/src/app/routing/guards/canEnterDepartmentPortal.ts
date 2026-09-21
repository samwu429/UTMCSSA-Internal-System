import { ADMINISTRATION_PERMISSIONS } from '@/shared/authorization/permissionEvaluation'
import { Permission } from '@/shared/api/contracts/authorization/permissionIdentifiers'
import type { SessionProfile } from '@/shared/api/contracts/identity/sessionProfile'
import type { ActingIdentity } from '@/features/portals/identity/actingIdentity'
import {
  PLATFORM_ADMIN_DEPARTMENT_SLUG,
  PLATFORM_ADMINISTRATOR_ROLE_KEY,
  isPresidiumOffice,
} from '@/shared/organization/offices'

const CROSS_DEPARTMENT_PERMISSIONS: readonly string[] = [
  Permission.DIRECTORY_VIEW_ALL_DEPARTMENTS,
  Permission.DOCUMENTS_VIEW_ALL_DEPARTMENTS,
  ...ADMINISTRATION_PERMISSIONS,
]

/**
 * Whether this account may open a given department portal.
 *
 * Members always enter their own department. Oversight accounts may also open another department's
 * address for supervision, but never the hidden administrator portal. The platform account may
 * preview any office; while previewing a department member, only that department stays open.
 *
 * 判断账号能否打开指定部门门户。成员只能进入自己的部门；监管账号也可打开其他部门，但看不到隐藏的
 * 管理员门户。平台账号可预览任意职务；预览部员时仅保持该部门可进入。
 */
export function canEnterDepartmentPortal(
  profile: SessionProfile,
  departmentSlug: string,
  actingIdentity: ActingIdentity | null = null,
): boolean {
  if (departmentSlug === PLATFORM_ADMIN_DEPARTMENT_SLUG) {
    return (
      profile.is_platform_administrator === true &&
      (actingIdentity === null || actingIdentity.officeKey === PLATFORM_ADMINISTRATOR_ROLE_KEY)
    )
  }

  if (profile.is_platform_administrator === true) {
    if (actingIdentity === null || actingIdentity.officeKey === PLATFORM_ADMINISTRATOR_ROLE_KEY) {
      return true
    }
    if (isPresidiumOffice(actingIdentity.officeKey)) {
      return true
    }
    return actingIdentity.departmentSlug === departmentSlug
  }

  if (profile.memberships.some((membership) => membership.department_slug === departmentSlug)) {
    return true
  }

  return canOpenEveryDepartmentPortal(profile, actingIdentity)
}

/**
 * Presidium officers may open every public department portal. The hidden administrator portal is
 * excluded. While the platform account previews a scoped office, this is false.
 *
 * 主席团可打开除隐藏管理门户外的各部门页面。平台账号在预览受限职务时此项为假。
 */
export function canOpenEveryDepartmentPortal(
  profile: SessionProfile,
  actingIdentity: ActingIdentity | null = null,
): boolean {
  if (profile.is_platform_administrator === true) {
    if (actingIdentity === null || actingIdentity.officeKey === PLATFORM_ADMINISTRATOR_ROLE_KEY) {
      return true
    }
    return isPresidiumOffice(actingIdentity.officeKey)
  }

  if (profile.primary_portal?.has_organization_oversight === true) {
    return true
  }

  return CROSS_DEPARTMENT_PERMISSIONS.some((permission) => profile.permissions.includes(permission))
}

import { Permission } from '@/shared/api/contracts/authorization/permissionIdentifiers'
import type { IdentityLens, SessionProfile } from '@/shared/api/contracts/identity/sessionProfile'
import {
  DEPARTMENT_DEPUTY_ROLE_KEY,
  DEPARTMENT_DIRECTOR_ROLE_KEY,
  DEPARTMENT_MEMBER_ROLE_KEY,
  PLATFORM_ADMIN_DEPARTMENT_SLUG,
  PLATFORM_ADMINISTRATOR_ROLE_KEY,
  PRESIDIUM_EXTERNAL_VP_ROLE_KEY,
  PRESIDIUM_INTERNAL_VP_ROLE_KEY,
  PRESIDIUM_PRESIDENT_ROLE_KEY,
  PRESIDIUM_SECRETARY_GENERAL_ROLE_KEY,
  officeKeysForDepartment,
} from '@/shared/organization/offices'

interface OfficeDescriptor {
  name_en: string
  name_zh: string
  permissions: readonly string[]
}

interface CatalogDepartment {
  slug: string
  name_en: string
  name_zh: string
}

const MEMBER_PERMISSIONS: readonly string[] = [
  Permission.DIRECTORY_VIEW,
  Permission.DOCUMENTS_VIEW,
  Permission.DOCUMENTS_UPLOAD,
  Permission.EVENTS_VIEW,
  Permission.ALUMNI_VIEW,
]

const DEPUTY_PERMISSIONS: readonly string[] = [
  ...MEMBER_PERMISSIONS,
  Permission.DIRECTORY_VIEW_CONTACT_DETAILS,
  Permission.DOCUMENTS_EDIT,
  Permission.EVENTS_CREATE,
  Permission.EVENTS_EDIT,
  Permission.NOTIFICATIONS_SEND_DEPARTMENT,
]

const DIRECTOR_PERMISSIONS: readonly string[] = [
  ...DEPUTY_PERMISSIONS,
  Permission.DIRECTORY_EXPORT,
  Permission.DOCUMENTS_DELETE,
  Permission.DOCUMENTS_MANAGE_CATEGORIES,
  Permission.EVENTS_DELETE,
]

const SECRETARY_GENERAL_PERMISSIONS: readonly string[] = [
  ...MEMBER_PERMISSIONS,
  Permission.DIRECTORY_VIEW_ALL_DEPARTMENTS,
  Permission.DIRECTORY_VIEW_CONTACT_DETAILS,
  Permission.DIRECTORY_EDIT_ANY_PROFILE,
  Permission.DIRECTORY_EXPORT,
  Permission.DOCUMENTS_VIEW_ALL_DEPARTMENTS,
  Permission.DOCUMENTS_EDIT,
  Permission.DOCUMENTS_MANAGE_CATEGORIES,
  Permission.EVENTS_CREATE,
  Permission.EVENTS_EDIT,
  Permission.NOTIFICATIONS_SEND_ORGANIZATION,
  Permission.ADMIN_VIEW_AUDIT_LOG,
]

const INTERNAL_VP_PERMISSIONS: readonly string[] = [
  ...DIRECTOR_PERMISSIONS,
  Permission.DIRECTORY_VIEW_ALL_DEPARTMENTS,
  Permission.DIRECTORY_EDIT_ANY_PROFILE,
  Permission.DOCUMENTS_VIEW_ALL_DEPARTMENTS,
  Permission.EVENTS_PUBLISH,
  Permission.NOTIFICATIONS_SEND_ORGANIZATION,
  Permission.ADMIN_MANAGE_DEPARTMENTS,
  Permission.ADMIN_DEACTIVATE_ACCOUNTS,
  Permission.ADMIN_VIEW_AUDIT_LOG,
]

const EXTERNAL_VP_PERMISSIONS: readonly string[] = [
  ...DIRECTOR_PERMISSIONS,
  Permission.DIRECTORY_VIEW_ALL_DEPARTMENTS,
  Permission.DOCUMENTS_VIEW_ALL_DEPARTMENTS,
  Permission.EVENTS_PUBLISH,
  Permission.ALUMNI_MANAGE,
  Permission.NOTIFICATIONS_SEND_ORGANIZATION,
]

const PRESIDENT_PERMISSIONS: readonly string[] = [
  ...DIRECTOR_PERMISSIONS,
  Permission.DIRECTORY_VIEW_ALL_DEPARTMENTS,
  Permission.DIRECTORY_EDIT_ANY_PROFILE,
  Permission.DOCUMENTS_VIEW_ALL_DEPARTMENTS,
  Permission.EVENTS_PUBLISH,
  Permission.ALUMNI_MANAGE,
  Permission.NOTIFICATIONS_SEND_ORGANIZATION,
  Permission.ADMIN_REVIEW_REGISTRATIONS,
  Permission.ADMIN_ASSIGN_DEPARTMENTS,
  Permission.ADMIN_MANAGE_ROLES,
  Permission.ADMIN_MANAGE_DEPARTMENTS,
  Permission.ADMIN_DEACTIVATE_ACCOUNTS,
  Permission.ADMIN_VIEW_AUDIT_LOG,
]

const OFFICE_CATALOG: Record<string, OfficeDescriptor> = {
  [DEPARTMENT_MEMBER_ROLE_KEY]: {
    name_en: 'Department Member',
    name_zh: '部员',
    permissions: MEMBER_PERMISSIONS,
  },
  [DEPARTMENT_DEPUTY_ROLE_KEY]: {
    name_en: 'Deputy Director',
    name_zh: '副部长',
    permissions: [
      ...DEPUTY_PERMISSIONS,
      Permission.ADMIN_REVIEW_REGISTRATIONS,
      Permission.ADMIN_ASSIGN_DEPARTMENTS,
    ],
  },
  [DEPARTMENT_DIRECTOR_ROLE_KEY]: {
    name_en: 'Director',
    name_zh: '部长',
    permissions: [
      ...DIRECTOR_PERMISSIONS,
      Permission.ADMIN_REVIEW_REGISTRATIONS,
      Permission.ADMIN_ASSIGN_DEPARTMENTS,
    ],
  },
  [PRESIDIUM_EXTERNAL_VP_ROLE_KEY]: {
    name_en: 'External Vice President',
    name_zh: '外务副主席',
    permissions: EXTERNAL_VP_PERMISSIONS,
  },
  [PRESIDIUM_INTERNAL_VP_ROLE_KEY]: {
    name_en: 'Internal Vice President',
    name_zh: '内务副主席',
    permissions: INTERNAL_VP_PERMISSIONS,
  },
  [PRESIDIUM_SECRETARY_GENERAL_ROLE_KEY]: {
    name_en: 'Secretary-General',
    name_zh: '秘书长',
    permissions: SECRETARY_GENERAL_PERMISSIONS,
  },
  [PRESIDIUM_PRESIDENT_ROLE_KEY]: {
    name_en: 'President',
    name_zh: '主席',
    permissions: PRESIDENT_PERMISSIONS,
  },
  [PLATFORM_ADMINISTRATOR_ROLE_KEY]: {
    name_en: 'Platform Administrator',
    name_zh: '平台管理员',
    permissions: Object.values(Permission),
  },
}

const SEEDED_DEPARTMENTS: readonly CatalogDepartment[] = [
  { slug: 'presidium', name_en: 'Presidium', name_zh: '主席团' },
  { slug: 'administration', name_en: 'Administration', name_zh: '行政部' },
  { slug: 'finance', name_en: 'Finance', name_zh: '财政部' },
  { slug: 'sponsorship', name_en: 'Sponsorship', name_zh: '赞助部' },
  { slug: 'events', name_en: 'Events', name_zh: '活动部' },
  { slug: 'publicity', name_en: 'Publicity', name_zh: '宣传部' },
  { slug: 'academic', name_en: 'Academic', name_zh: '学术部' },
  { slug: 'alumni', name_en: 'Alumni Network', name_zh: '毕业生校友' },
  { slug: PLATFORM_ADMIN_DEPARTMENT_SLUG, name_en: 'Platform Administrator', name_zh: '管理员账户' },
]

export function officeNameZh(officeKey: string): string {
  return OFFICE_CATALOG[officeKey]?.name_zh ?? officeKey
}

export function officePermissions(officeKey: string): readonly string[] {
  return OFFICE_CATALOG[officeKey]?.permissions ?? []
}

/**
 * The hidden technical account is identified by the seeded membership, the settings permission,
 * or the session flag. Any one of these is enough so the office switcher still appears when an
 * older API payload omits `is_platform_administrator`.
 *
 * 隐藏技术账号可由种子归属、系统设置权限或会话标记识别。任一成立即可，
 * 避免旧版接口未返回 `is_platform_administrator` 时职务切换消失。
 */
export function isHiddenPlatformAdministrator(profile: SessionProfile): boolean {
  if (profile.is_platform_administrator === true) {
    return true
  }
  if (profile.permissions.includes(Permission.SYSTEM_MANAGE_SETTINGS)) {
    return true
  }
  return profile.memberships.some(
    (membership) =>
      membership.department_slug === PLATFORM_ADMIN_DEPARTMENT_SLUG ||
      membership.role_key === PLATFORM_ADMINISTRATOR_ROLE_KEY,
  )
}

export function buildAdministratorIdentityLenses(
  extraDepartments: readonly CatalogDepartment[] = [],
): IdentityLens[] {
  const seen = new Map<string, CatalogDepartment>()
  for (const department of [...SEEDED_DEPARTMENTS, ...extraDepartments]) {
    seen.set(department.slug, {
      slug: department.slug,
      name_en: department.name_en,
      name_zh: department.name_zh,
    })
  }

  const lenses: IdentityLens[] = []
  for (const department of seen.values()) {
    for (const officeKey of officeKeysForDepartment(department.slug)) {
      const office = OFFICE_CATALOG[officeKey]
      if (office === undefined) {
        continue
      }
      lenses.push({
        department_slug: department.slug,
        department_name_en: department.name_en,
        department_name_zh: department.name_zh,
        office_key: officeKey,
        office_name_en: office.name_en,
        office_name_zh: office.name_zh,
        permissions: [...office.permissions],
      })
    }
  }
  return lenses
}

export function resolveAdministratorIdentityLenses(
  profile: SessionProfile,
  extraDepartments: readonly CatalogDepartment[] = [],
): IdentityLens[] {
  if ((profile.identity_lenses?.length ?? 0) > 0) {
    return profile.identity_lenses ?? []
  }
  return buildAdministratorIdentityLenses(extraDepartments)
}

export function findIdentityLens(
  lenses: readonly IdentityLens[],
  departmentSlug: string,
  officeKey: string,
): IdentityLens | null {
  return (
    lenses.find(
      (lens) => lens.department_slug === departmentSlug && lens.office_key === officeKey,
    ) ?? null
  )
}

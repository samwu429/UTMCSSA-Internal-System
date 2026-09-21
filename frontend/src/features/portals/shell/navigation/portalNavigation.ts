import { portalSegments, PORTAL_MODULE_TO_SEGMENT } from '@/app/routing/portalSegments'
import { routePaths } from '@/app/routing/routePaths'
import { Permission } from '@/shared/api/contracts/authorization/permissionIdentifiers'
import { ADMINISTRATION_PERMISSIONS, hasAnyPermission } from '@/shared/authorization/permissionEvaluation'

export interface PortalNavigationItem {
  id: string
  label: string
  englishLabel: string
  to: string
  requiredPermissions?: readonly string[]
}

const MODULE_LABELS: Record<string, { label: string; englishLabel: string }> = {
  overview: { label: '部门主页', englishLabel: 'Home' },
  announcements: { label: '公告', englishLabel: 'Notices' },
  department_directory: { label: '成员名录', englishLabel: 'Members' },
  document_vault: { label: '文件库', englishLabel: 'Files' },
  activity_calendar: { label: '活动日历', englishLabel: 'Activities' },
  sponsor_pipeline: { label: '赞助跟进', englishLabel: 'Sponsors' },
  budget_ledger: { label: '预算台账', englishLabel: 'Budget' },
  content_calendar: { label: '宣传排期', englishLabel: 'Content' },
  academic_resources: { label: '学术支持', englishLabel: 'Academic' },
  alumni_network: { label: '校友网络', englishLabel: 'Alumni' },
  cross_department_oversight: { label: '跨部门监管', englishLabel: 'Oversight' },
  admin_console: { label: '管理后台', englishLabel: 'Admin' },
}

const MODULE_PERMISSIONS: Record<string, readonly string[]> = {
  department_directory: [Permission.DIRECTORY_VIEW],
  document_vault: [Permission.DOCUMENTS_VIEW],
  activity_calendar: [Permission.EVENTS_VIEW],
  alumni_network: [Permission.ALUMNI_VIEW],
  admin_console: ADMINISTRATION_PERMISSIONS,
}

/**
 * Build the sidebar for one department from the modules the server attached to that portal.
 *
 * Hidden modules stay hidden even if the member could technically call the API; the point is that
 * a finance officer should feel they are inside a finance system, not a shared toolkit.
 *
 * 按服务端为该门户配置的模块生成侧栏。即使成员 technically 能调用某接口，未开放的模块也不出现：
 * 财政部成员应感觉身处财政系统，而不是一套共用工具箱。
 */
export function buildPortalNavigation(
  departmentSlug: string,
  portalModules: readonly string[],
  permissions: readonly string[],
): PortalNavigationItem[] {
  const items: PortalNavigationItem[] = []

  for (const moduleKey of portalModules) {
    const segment = PORTAL_MODULE_TO_SEGMENT[moduleKey]
    if (segment === undefined) {
      continue
    }

    const labels = MODULE_LABELS[moduleKey]
    if (labels === undefined) {
      continue
    }

    const required = MODULE_PERMISSIONS[moduleKey]
    if (required !== undefined && !hasAnyPermission(permissions, required)) {
      continue
    }

    items.push({
      id: moduleKey,
      label: labels.label,
      englishLabel: labels.englishLabel,
      to: routePaths.portalSection(departmentSlug, segment),
      requiredPermissions: required,
    })
  }

  if (
    hasAnyPermission(permissions, [
      Permission.ADMIN_REVIEW_REGISTRATIONS,
      Permission.ADMIN_ASSIGN_DEPARTMENTS,
    ])
  ) {
    items.push({
      id: 'appointments',
      label: '任职',
      englishLabel: 'Offices',
      to: routePaths.portalSection(departmentSlug, portalSegments.appointments),
      requiredPermissions: [
        Permission.ADMIN_REVIEW_REGISTRATIONS,
        Permission.ADMIN_ASSIGN_DEPARTMENTS,
      ],
    })
  }

  items.push({
    id: 'profile',
    label: '我的档案',
    englishLabel: 'Profile',
    to: routePaths.portalSection(departmentSlug, portalSegments.profile),
  })

  return items
}

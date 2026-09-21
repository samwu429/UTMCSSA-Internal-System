/**
 * URL segments each portal module occupies under `/portal/:departmentSlug`.
 *
 * The slug in the path is what makes two people looking at the same feature still feel they are
 * inside different systems: finance and events share a vault, but never the same address.
 *
 * 各门户模块在 `/portal/:departmentSlug` 下占用的路径段。
 * 路径中的部门标识让两个成员即使使用同一功能，也仍处在各自的系统地址中。
 */
export const portalSegments = {
  overview: '',
  announcements: 'announcements',
  members: 'members',
  files: 'files',
  activities: 'activities',
  sponsors: 'sponsors',
  budget: 'budget',
  content: 'content',
  academic: 'academic',
  network: 'network',
  oversight: 'oversight',
  admin: 'admin',
  profile: 'profile',
} as const

export type PortalSegment = (typeof portalSegments)[keyof typeof portalSegments]

export const PORTAL_MODULE_TO_SEGMENT: Record<string, PortalSegment> = {
  overview: portalSegments.overview,
  announcements: portalSegments.announcements,
  department_directory: portalSegments.members,
  document_vault: portalSegments.files,
  activity_calendar: portalSegments.activities,
  sponsor_pipeline: portalSegments.sponsors,
  budget_ledger: portalSegments.budget,
  content_calendar: portalSegments.content,
  academic_resources: portalSegments.academic,
  alumni_network: portalSegments.network,
  cross_department_oversight: portalSegments.oversight,
  admin_console: portalSegments.admin,
}

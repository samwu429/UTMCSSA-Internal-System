/**
 * Visibility narrows who may open a document; it never widens access beyond the viewer's
 * permissions.
 *
 * 可见性只做收窄，不会在查看者权限之外放宽访问。
 */
export const DocumentVisibility = {
  DEPARTMENT: 'department',
  ORGANIZATION: 'organization',
  PRESIDIUM_ONLY: 'presidium_only',
} as const

export type DocumentVisibility = (typeof DocumentVisibility)[keyof typeof DocumentVisibility]

/** Top-level classification the association uses when filing paperwork. */
export const DocumentKind = {
  GOVERNANCE: 'governance',
  PLANNING: 'planning',
  FINANCE: 'finance',
  SPONSORSHIP: 'sponsorship',
  PUBLICITY: 'publicity',
  ACADEMIC: 'academic',
  ARCHIVE: 'archive',
} as const

export type DocumentKind = (typeof DocumentKind)[keyof typeof DocumentKind]

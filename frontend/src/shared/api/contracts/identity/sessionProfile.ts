import type { GrantScope } from '@/shared/api/contracts/authorization/grantScope'
import type { IsoDateTimeString, UuidString } from '@/shared/api/contracts/common/scalarTypes'
import type {
  AccountStatus,
  AffiliationType,
} from '@/shared/api/contracts/identity/accountLifecycle'

/**
 * Everything needed to theme and populate one department portal.
 *
 * 用于为某个部门门户着色并填充内容的全部信息。
 */
export interface PortalConfiguration {
  department_id: UuidString
  slug: string
  name_en: string
  name_zh: string
  summary_en?: string | null
  summary_zh?: string | null
  accent_color: string
  portal_modules: string[]
  has_organization_oversight: boolean
  portal_path: string
}

export interface IdentityLens {
  department_slug: string
  department_name_en: string
  department_name_zh: string
  office_key: string
  office_name_en: string
  office_name_zh: string
  permissions: string[]
}

export interface MembershipSummary {
  membership_id: UuidString
  department_id: UuidString
  department_slug: string
  department_name_en: string
  department_name_zh: string
  department_accent_color: string
  role_id: UuidString
  role_key?: string | null
  role_name_en: string
  role_name_zh: string
  role_scope: GrantScope
  title_en?: string | null
  title_zh?: string | null
  term_label?: string | null
  is_primary: boolean
}

/**
 * The one bundle loaded after sign-in: identity, memberships, effective permissions, and the
 * landing department's portal configuration.
 *
 * 登录后一次性加载的数据包：身份、部门归属、有效权限，以及落地部门的门户配置。
 */
export interface SessionProfile {
  user_id: UuidString
  email: string
  display_name: string
  legal_name: string
  chinese_name?: string | null
  avatar_url?: string | null
  status: AccountStatus
  affiliation: AffiliationType
  graduation_year?: number | null
  program_of_study?: string | null

  memberships: MembershipSummary[]
  primary_portal?: PortalConfiguration | null
  permissions: string[]
  is_platform_administrator?: boolean
  identity_lenses?: IdentityLens[]

  receives_daily_digest: boolean
  receives_activity_notices: boolean
  preferred_language: string
  last_login_at?: IsoDateTimeString | null
}

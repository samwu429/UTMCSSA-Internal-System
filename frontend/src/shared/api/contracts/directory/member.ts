import type { PaginatedCollection } from '@/shared/api/contracts/common/pagination'
import type { IsoDateTimeString, UuidString } from '@/shared/api/contracts/common/scalarTypes'
import type {
  AccountStatus,
  AffiliationType,
} from '@/shared/api/contracts/identity/accountLifecycle'

export interface MemberDepartmentBadge {
  membership_id: UuidString
  department_id: UuidString
  slug: string
  name_zh: string
  name_en: string
  accent_color: string
  role_name_zh: string
  role_name_en: string
  title_zh?: string | null
  title_en?: string | null
  is_primary: boolean
}

/**
 * Contact fields are absent, not masked, for viewers without the contact-details permission, so
 * the table must treat them as genuinely unknown rather than as empty strings.
 *
 * 对无联系方式权限的查看者，后端直接省略而非打码，
 * 因此表格须将其视为「未知」而非空字符串。
 */
export interface MemberSummary {
  user_id: UuidString
  display_name: string
  legal_name: string
  chinese_name?: string | null
  avatar_url?: string | null
  status: AccountStatus
  affiliation: AffiliationType
  graduation_year?: number | null
  program_of_study?: string | null
  departments: MemberDepartmentBadge[]

  email?: string | null
  phone_number?: string | null
  wechat_id?: string | null
}

export interface MemberDetail extends MemberSummary {
  biography?: string | null
  campus?: string | null
  enrolment_year?: number | null
  pronouns?: string | null
  created_at?: IsoDateTimeString | null
  last_login_at?: IsoDateTimeString | null
}

export type MemberPage = PaginatedCollection<MemberSummary>

export interface MemberProfileUpdate {
  preferred_name?: string | null
  chinese_name?: string | null
  pronouns?: string | null
  phone_number?: string | null
  wechat_id?: string | null
  program_of_study?: string | null
  graduation_year?: number | null
  enrolment_year?: number | null
  campus?: string | null
  biography?: string | null
  avatar_url?: string | null
}

export interface NotificationPreferenceUpdate {
  receives_daily_digest?: boolean | null
  receives_activity_notices?: boolean | null
  preferred_language?: string | null
}

export interface MemberDirectoryQuery {
  search?: string
  department_id?: UuidString
  graduation_year?: number
  affiliation?: AffiliationType
  status?: AccountStatus
  page?: number
  page_size?: number
}

import type { PaginatedCollection } from '@/shared/api/contracts/common/pagination'
import type { UuidString } from '@/shared/api/contracts/common/scalarTypes'

/**
 * Contact channels appear only when the graduate opted into being reached.
 *
 * 仅当校友本人开启联络意愿时才会返回联系方式。
 */
export interface AlumniSummary {
  user_id: UuidString
  display_name: string
  chinese_name?: string | null
  avatar_url?: string | null
  graduation_year?: number | null
  program_of_study?: string | null
  degree?: string | null
  current_employer?: string | null
  current_role?: string | null
  industry?: string | null
  city?: string | null
  country?: string | null
  expertise_tags: string[]
  open_to_mentorship: boolean
  open_to_referrals: boolean
  message_to_students?: string | null

  email?: string | null
  linkedin_url?: string | null
  personal_site_url?: string | null
}

export type AlumniPage = PaginatedCollection<AlumniSummary>

export interface AlumniProfileUpdate {
  degree?: string | null
  current_employer?: string | null
  current_role?: string | null
  industry?: string | null
  city?: string | null
  country?: string | null
  linkedin_url?: string | null
  personal_site_url?: string | null
  expertise_tags?: string[] | null
  open_to_mentorship?: boolean | null
  open_to_referrals?: boolean | null
  is_discoverable?: boolean | null
  message_to_students?: string | null
}

export interface AlumniDirectoryQuery {
  search?: string
  graduation_year?: number
  industry?: string
  city?: string
  open_to_mentorship?: boolean
  page?: number
  page_size?: number
}

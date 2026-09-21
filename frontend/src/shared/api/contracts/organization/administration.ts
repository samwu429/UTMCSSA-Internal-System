import type { PaginatedCollection } from '@/shared/api/contracts/common/pagination'
import type { IsoDateTimeString, UuidString } from '@/shared/api/contracts/common/scalarTypes'
import type {
  AccountStatus,
  AffiliationType,
} from '@/shared/api/contracts/identity/accountLifecycle'
import type { AuditAction } from '@/shared/api/contracts/organization/auditAction'

/** An account that proved its mailbox and is waiting for a placement decision. */
export interface PendingRegistration {
  user_id: UuidString
  email: string
  legal_name: string
  chinese_name?: string | null
  preferred_name?: string | null
  affiliation: AffiliationType
  graduation_year?: number | null
  enrolment_year?: number | null
  program_of_study?: string | null
  phone_number?: string | null
  requested_department_slug?: string | null
  email_verified_at?: IsoDateTimeString | null
  registered_at: IsoDateTimeString
}

export interface RegistrationApproval {
  department_id: UuidString
  role_id: UuidString
  title_en?: string | null
  title_zh?: string | null
  term_label?: string | null
  welcome_note?: string | null
}

export interface RegistrationRejection {
  reason_zh: string
  reason_en?: string | null
}

export interface AccountStatusChange {
  status: AccountStatus
  reason?: string | null
}

export interface AdministrationActionResult {
  user_id: UuidString
  status: AccountStatus
  message_en: string
  message_zh: string
}

export interface AuditEntryView {
  id: UuidString
  action: AuditAction
  actor_id?: UuidString | null
  actor_name?: string | null
  target_type: string
  target_id?: UuidString | null
  department_id?: UuidString | null
  summary: string
  created_at: IsoDateTimeString
}

export type AuditEntryPage = PaginatedCollection<AuditEntryView>

/** Numbers the presidium dashboard opens with. */
export interface OversightSnapshot {
  total_active_members: number
  total_alumni: number
  pending_registrations: number
  suspended_accounts: number
  departments: number
  documents: number
  upcoming_activities: number
}

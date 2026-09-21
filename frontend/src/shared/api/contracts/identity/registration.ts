import type { IsoDateTimeString } from '@/shared/api/contracts/common/scalarTypes'
import type {
  AccountStatus,
  AffiliationType,
  VerificationPurpose,
} from '@/shared/api/contracts/identity/accountLifecycle'

/**
 * Sign-up payload. `requested_department_slug` is a preference the presidium may override during
 * approval, so the form treats it as optional rather than as a placement decision.
 *
 * requested_department_slug 仅为意向，主席团审批时可另行安排，因此表单将其视为可选项而非最终归属。
 */
export interface RegistrationRequest {
  email: string
  password: string
  legal_name: string
  chinese_name?: string | null
  preferred_name?: string | null
  graduation_year?: number | null
  enrolment_year?: number | null
  program_of_study?: string | null
  phone_number?: string | null
  requested_department_slug?: string | null
}

export interface RegistrationAccepted {
  email: string
  affiliation: AffiliationType
  status: AccountStatus
  verification_expires_at: IsoDateTimeString
  message_en: string
  message_zh: string
}

export interface VerificationCodeRequest {
  email: string
  purpose: VerificationPurpose
}

export interface VerificationCodeIssued {
  email: string
  expires_at: IsoDateTimeString
}

export interface VerificationCodeSubmission {
  email: string
  code: string
  purpose: VerificationPurpose
}

export interface VerificationResult {
  email: string
  status: AccountStatus
  awaiting_approval: boolean
  message_en: string
  message_zh: string
}

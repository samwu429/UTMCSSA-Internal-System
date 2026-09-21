/**
 * Account and verification vocabulary mirrored from the identity domain enums.
 *
 * 与后端身份域枚举保持一致的账号与验证状态词表。
 */

export const AccountStatus = {
  PENDING_VERIFICATION: 'pending_verification',
  PENDING_APPROVAL: 'pending_approval',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  REJECTED: 'rejected',
} as const

export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus]

export const AffiliationType = {
  STUDENT: 'student',
  ALUMNUS: 'alumnus',
} as const

export type AffiliationType = (typeof AffiliationType)[keyof typeof AffiliationType]

export const VerificationPurpose = {
  REGISTRATION: 'registration',
  PASSWORD_RESET: 'password_reset',
  EMAIL_CHANGE: 'email_change',
} as const

export type VerificationPurpose = (typeof VerificationPurpose)[keyof typeof VerificationPurpose]

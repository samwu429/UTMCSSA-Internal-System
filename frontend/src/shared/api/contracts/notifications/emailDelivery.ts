export const EmailDeliveryStatus = {
  QUEUED: 'queued',
  SENT: 'sent',
  FAILED: 'failed',
  SKIPPED: 'skipped',
} as const

export type EmailDeliveryStatus = (typeof EmailDeliveryStatus)[keyof typeof EmailDeliveryStatus]

export const EmailTemplateKey = {
  VERIFICATION_CODE: 'verification_code',
  PASSWORD_RESET_CODE: 'password_reset_code',
  REGISTRATION_APPROVED: 'registration_approved',
  REGISTRATION_REJECTED: 'registration_rejected',
  ACTIVITY_ANNOUNCEMENT: 'activity_announcement',
  DEPARTMENT_BROADCAST: 'department_broadcast',
  DAILY_DIGEST: 'daily_digest',
} as const

export type EmailTemplateKey = (typeof EmailTemplateKey)[keyof typeof EmailTemplateKey]

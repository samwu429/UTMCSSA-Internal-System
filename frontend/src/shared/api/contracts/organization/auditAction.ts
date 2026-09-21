/**
 * Actions recorded in the append-only audit trail.
 *
 * 追加式操作轨迹中记录的动作类型。
 */
export const AuditAction = {
  REGISTRATION_APPROVED: 'registration_approved',
  REGISTRATION_REJECTED: 'registration_rejected',
  ACCOUNT_SUSPENDED: 'account_suspended',
  ACCOUNT_REACTIVATED: 'account_reactivated',
  MEMBERSHIP_GRANTED: 'membership_granted',
  MEMBERSHIP_REVOKED: 'membership_revoked',
  MEMBERSHIP_ROLE_CHANGED: 'membership_role_changed',
  PRIMARY_DEPARTMENT_CHANGED: 'primary_department_changed',
  ROLE_CREATED: 'role_created',
  ROLE_UPDATED: 'role_updated',
  ROLE_DELETED: 'role_deleted',
  DEPARTMENT_CREATED: 'department_created',
  DEPARTMENT_UPDATED: 'department_updated',
  DOCUMENT_DELETED: 'document_deleted',
  BROADCAST_SENT: 'broadcast_sent',
} as const

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction]

/**
 * Canonical permission identifiers mirrored from the backend catalog.
 *
 * The frontend consults them only to hide controls a member cannot use; every action is authorized
 * again on the server, so an out-of-date copy degrades the interface but never the security model.
 *
 * 前端仅用其隐藏不可用控件；所有操作在服务端二次鉴权，
 * 因此该副本过期只会影响界面呈现，不会削弱安全模型。
 */
export const Permission = {
  DIRECTORY_VIEW: 'directory.view',
  DIRECTORY_VIEW_ALL_DEPARTMENTS: 'directory.view_all_departments',
  DIRECTORY_VIEW_CONTACT_DETAILS: 'directory.view_contact_details',
  DIRECTORY_EDIT_ANY_PROFILE: 'directory.edit_any_profile',
  DIRECTORY_EXPORT: 'directory.export',

  ALUMNI_VIEW: 'alumni.view',
  ALUMNI_MANAGE: 'alumni.manage',

  DOCUMENTS_VIEW: 'documents.view',
  DOCUMENTS_UPLOAD: 'documents.upload',
  DOCUMENTS_EDIT: 'documents.edit',
  DOCUMENTS_DELETE: 'documents.delete',
  DOCUMENTS_MANAGE_CATEGORIES: 'documents.manage_categories',
  DOCUMENTS_VIEW_ALL_DEPARTMENTS: 'documents.view_all_departments',

  EVENTS_VIEW: 'events.view',
  EVENTS_CREATE: 'events.create',
  EVENTS_EDIT: 'events.edit',
  EVENTS_DELETE: 'events.delete',
  EVENTS_PUBLISH: 'events.publish',

  NOTIFICATIONS_SEND_DEPARTMENT: 'notifications.send_department',
  NOTIFICATIONS_SEND_ORGANIZATION: 'notifications.send_organization',

  ADMIN_REVIEW_REGISTRATIONS: 'admin.review_registrations',
  ADMIN_ASSIGN_DEPARTMENTS: 'admin.assign_departments',
  ADMIN_MANAGE_ROLES: 'admin.manage_roles',
  ADMIN_MANAGE_DEPARTMENTS: 'admin.manage_departments',
  ADMIN_DEACTIVATE_ACCOUNTS: 'admin.deactivate_accounts',
  ADMIN_VIEW_AUDIT_LOG: 'admin.view_audit_log',

  SYSTEM_MANAGE_SETTINGS: 'system.manage_settings',
} as const

export type Permission = (typeof Permission)[keyof typeof Permission]

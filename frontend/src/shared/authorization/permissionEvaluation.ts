import { Permission } from '@/shared/api/contracts/authorization/permissionIdentifiers'

/**
 * Permission checks used to hide controls the member cannot operate.
 *
 * Hiding is a courtesy, not a boundary: the backend authorizes every call again, so a wrong answer
 * here shows a control that fails, never one that succeeds without authority.
 *
 * 这些判断仅用于隐藏成员无法使用的控件。隐藏属于体验优化而非安全边界：
 * 后端会对每次调用重新鉴权，判断有误只会让控件调用失败，不会造成越权成功。
 */
export function hasPermission(granted: readonly string[], required: string): boolean {
  return granted.includes(required)
}

export function hasAnyPermission(granted: readonly string[], required: readonly string[]): boolean {
  return required.some((permission) => granted.includes(permission))
}

export function hasEveryPermission(
  granted: readonly string[],
  required: readonly string[],
): boolean {
  return required.every((permission) => granted.includes(permission))
}

/**
 * The permissions that make the administration console meaningful to open at all.
 *
 * 只要持有其中任意一项，管理后台就有可操作内容。
 */
export const ADMINISTRATION_PERMISSIONS: readonly string[] = [
  Permission.ADMIN_REVIEW_REGISTRATIONS,
  Permission.ADMIN_ASSIGN_DEPARTMENTS,
  Permission.ADMIN_MANAGE_ROLES,
  Permission.ADMIN_MANAGE_DEPARTMENTS,
  Permission.ADMIN_DEACTIVATE_ACCOUNTS,
  Permission.ADMIN_VIEW_AUDIT_LOG,
]

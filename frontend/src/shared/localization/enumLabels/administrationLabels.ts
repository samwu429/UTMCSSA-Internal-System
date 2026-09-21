import { GrantScope } from '@/shared/api/contracts/authorization/grantScope'
import { AuditAction } from '@/shared/api/contracts/organization/auditAction'

export const auditActionLabels: Record<AuditAction, string> = {
  [AuditAction.REGISTRATION_APPROVED]: '通过注册申请',
  [AuditAction.REGISTRATION_REJECTED]: '拒绝注册申请',
  [AuditAction.ACCOUNT_SUSPENDED]: '停用账号',
  [AuditAction.ACCOUNT_REACTIVATED]: '恢复账号',
  [AuditAction.MEMBERSHIP_GRANTED]: '加入部门',
  [AuditAction.MEMBERSHIP_REVOKED]: '移出部门',
  [AuditAction.MEMBERSHIP_ROLE_CHANGED]: '调整权限集合',
  [AuditAction.PRIMARY_DEPARTMENT_CHANGED]: '变更主归属部门',
  [AuditAction.ROLE_CREATED]: '创建权限集合',
  [AuditAction.ROLE_UPDATED]: '修改权限集合',
  [AuditAction.ROLE_DELETED]: '删除权限集合',
  [AuditAction.DEPARTMENT_CREATED]: '创建部门',
  [AuditAction.DEPARTMENT_UPDATED]: '修改部门',
  [AuditAction.DOCUMENT_DELETED]: '删除文件',
  [AuditAction.BROADCAST_SENT]: '发送群发邮件',
}

export const grantScopeLabels: Record<GrantScope, string> = {
  [GrantScope.DEPARTMENT]: '仅在所属部门内生效',
  [GrantScope.ORGANIZATION]: '在全社团范围内生效',
}

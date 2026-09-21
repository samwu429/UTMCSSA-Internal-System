import { requestJson, requestNoContent } from '@/shared/api/client/apiClient'
import type { UuidString } from '@/shared/api/contracts/common/scalarTypes'
import type {
  PermissionCatalog,
  RoleCreate,
  RoleDetail,
  RoleSummary,
  RoleUpdate,
} from '@/shared/api/contracts/organization/role'

export function fetchPermissionCatalog(signal?: AbortSignal): Promise<PermissionCatalog> {
  return requestJson<PermissionCatalog>('/roles/permission-catalog', { signal })
}

export function fetchRoles(
  departmentId: UuidString | undefined,
  signal?: AbortSignal,
): Promise<RoleSummary[]> {
  return requestJson<RoleSummary[]>('/roles', {
    query: { department_id: departmentId },
    signal,
  })
}

export function fetchRoleDetail(
  roleId: UuidString,
  signal?: AbortSignal,
): Promise<RoleDetail> {
  return requestJson<RoleDetail>(`/roles/${roleId}`, { signal })
}

export function createRole(payload: RoleCreate): Promise<RoleDetail> {
  return requestJson<RoleDetail>('/roles', { method: 'POST', json: payload })
}

export function updateRole(roleId: UuidString, payload: RoleUpdate): Promise<RoleDetail> {
  return requestJson<RoleDetail>(`/roles/${roleId}`, { method: 'PATCH', json: payload })
}

export function deleteRole(roleId: UuidString): Promise<void> {
  return requestNoContent(`/roles/${roleId}`, { method: 'DELETE' })
}

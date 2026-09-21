import { requestJson } from '@/shared/api/client/apiClient'
import type { UuidString } from '@/shared/api/contracts/common/scalarTypes'
import type { PortalConfiguration } from '@/shared/api/contracts/identity/sessionProfile'
import type {
  DepartmentCreate,
  DepartmentSummary,
  DepartmentUpdate,
  DepartmentWithHeadcount,
} from '@/shared/api/contracts/organization/department'

export function fetchDepartments(signal?: AbortSignal): Promise<DepartmentWithHeadcount[]> {
  return requestJson<DepartmentWithHeadcount[]>('/departments', { signal })
}

export function fetchDepartment(
  slug: string,
  signal?: AbortSignal,
): Promise<DepartmentSummary> {
  return requestJson<DepartmentSummary>(`/departments/${slug}`, { signal })
}

export function fetchPortalConfiguration(
  slug: string,
  signal?: AbortSignal,
): Promise<PortalConfiguration> {
  return requestJson<PortalConfiguration>(`/departments/${slug}/portal`, { signal })
}

export function createDepartment(payload: DepartmentCreate): Promise<DepartmentSummary> {
  return requestJson<DepartmentSummary>('/departments', { method: 'POST', json: payload })
}

export function updateDepartment(
  departmentId: UuidString,
  payload: DepartmentUpdate,
): Promise<DepartmentSummary> {
  return requestJson<DepartmentSummary>(`/departments/${departmentId}`, {
    method: 'PATCH',
    json: payload,
  })
}

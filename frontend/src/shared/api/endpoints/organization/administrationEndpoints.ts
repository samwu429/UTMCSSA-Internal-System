import { requestJson } from '@/shared/api/client/apiClient'
import type { PaginationQuery } from '@/shared/api/contracts/common/pagination'
import type { UuidString } from '@/shared/api/contracts/common/scalarTypes'
import type {
  AccountStatusChange,
  AdministrationActionResult,
  AuditEntryPage,
  OversightSnapshot,
  PendingRegistration,
  RegistrationApproval,
  RegistrationRejection,
} from '@/shared/api/contracts/organization/administration'

export function fetchOversightSnapshot(signal?: AbortSignal): Promise<OversightSnapshot> {
  return requestJson<OversightSnapshot>('/administration/overview', { signal })
}

export function fetchPendingRegistrations(
  signal?: AbortSignal,
): Promise<PendingRegistration[]> {
  return requestJson<PendingRegistration[]>('/administration/registrations/pending', { signal })
}

export function approveRegistration(
  userId: UuidString,
  payload: RegistrationApproval,
): Promise<AdministrationActionResult> {
  return requestJson<AdministrationActionResult>(
    `/administration/registrations/${userId}/approve`,
    { method: 'POST', json: payload },
  )
}

export function rejectRegistration(
  userId: UuidString,
  payload: RegistrationRejection,
): Promise<AdministrationActionResult> {
  return requestJson<AdministrationActionResult>(
    `/administration/registrations/${userId}/reject`,
    { method: 'POST', json: payload },
  )
}

export function changeAccountStatus(
  userId: UuidString,
  payload: AccountStatusChange,
): Promise<AdministrationActionResult> {
  return requestJson<AdministrationActionResult>(`/administration/accounts/${userId}/status`, {
    method: 'POST',
    json: payload,
  })
}

export function fetchAuditEntryPage(
  query: PaginationQuery,
  signal?: AbortSignal,
): Promise<AuditEntryPage> {
  return requestJson<AuditEntryPage>('/administration/audit-log', {
    query: { ...query },
    signal,
  })
}

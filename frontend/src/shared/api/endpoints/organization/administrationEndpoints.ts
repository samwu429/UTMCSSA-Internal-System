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
import type {
  OfficeAppointment,
  OfficeBoard,
} from '@/shared/api/contracts/organization/appointment'
import type { MembershipSummary } from '@/shared/api/contracts/identity/sessionProfile'

export function fetchOfficeBoard(signal?: AbortSignal): Promise<OfficeBoard> {
  return requestJson<OfficeBoard>('/administration/offices', { signal })
}

export function appointOffice(payload: OfficeAppointment): Promise<MembershipSummary> {
  return requestJson<MembershipSummary>('/administration/offices', {
    method: 'POST',
    json: payload,
  })
}

export function releaseOffice(membershipId: UuidString): Promise<MembershipSummary> {
  return requestJson<MembershipSummary>(`/administration/offices/${membershipId}/release`, {
    method: 'POST',
  })
}

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

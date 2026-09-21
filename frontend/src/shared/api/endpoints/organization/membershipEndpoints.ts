import { requestJson, requestNoContent } from '@/shared/api/client/apiClient'
import type { UuidString } from '@/shared/api/contracts/common/scalarTypes'
import type { MembershipSummary } from '@/shared/api/contracts/identity/sessionProfile'
import type {
  MembershipAssignment,
  MembershipUpdate,
} from '@/shared/api/contracts/organization/role'

export function assignMembership(
  payload: MembershipAssignment,
): Promise<MembershipSummary> {
  return requestJson<MembershipSummary>('/memberships', { method: 'POST', json: payload })
}

export function updateMembership(
  membershipId: UuidString,
  payload: MembershipUpdate,
): Promise<MembershipSummary> {
  return requestJson<MembershipSummary>(`/memberships/${membershipId}`, {
    method: 'PATCH',
    json: payload,
  })
}

export function removeMembership(membershipId: UuidString): Promise<void> {
  return requestNoContent(`/memberships/${membershipId}`, { method: 'DELETE' })
}

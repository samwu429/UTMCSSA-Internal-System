import { requestBlob, requestJson } from '@/shared/api/client/apiClient'
import type { UuidString } from '@/shared/api/contracts/common/scalarTypes'
import type {
  MemberDetail,
  MemberDirectoryQuery,
  MemberPage,
  MemberProfileUpdate,
} from '@/shared/api/contracts/directory/member'

export function fetchMemberPage(
  query: MemberDirectoryQuery,
  signal?: AbortSignal,
): Promise<MemberPage> {
  return requestJson<MemberPage>('/members', { query: { ...query }, signal })
}

export function fetchMemberDetail(
  userId: UuidString,
  signal?: AbortSignal,
): Promise<MemberDetail> {
  return requestJson<MemberDetail>(`/members/${userId}`, { signal })
}

export function updateOwnProfile(payload: MemberProfileUpdate): Promise<MemberDetail> {
  return requestJson<MemberDetail>('/members/me', { method: 'PATCH', json: payload })
}

export function updateMemberProfile(
  userId: UuidString,
  payload: MemberProfileUpdate,
): Promise<MemberDetail> {
  return requestJson<MemberDetail>(`/members/${userId}`, { method: 'PATCH', json: payload })
}

export function downloadMemberRoster(): Promise<Blob> {
  return requestBlob('/members/export')
}

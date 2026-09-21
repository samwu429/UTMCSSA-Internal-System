import { requestJson } from '@/shared/api/client/apiClient'
import type { UuidString } from '@/shared/api/contracts/common/scalarTypes'
import type {
  AlumniDirectoryQuery,
  AlumniPage,
  AlumniProfileUpdate,
  AlumniSummary,
} from '@/shared/api/contracts/directory/alumni'

export function fetchAlumniPage(
  query: AlumniDirectoryQuery,
  signal?: AbortSignal,
): Promise<AlumniPage> {
  return requestJson<AlumniPage>('/alumni', { query: { ...query }, signal })
}

export function fetchAlumniProfile(
  userId: UuidString,
  signal?: AbortSignal,
): Promise<AlumniSummary> {
  return requestJson<AlumniSummary>(`/alumni/${userId}`, { signal })
}

export function replaceOwnAlumniProfile(
  payload: AlumniProfileUpdate,
): Promise<AlumniSummary> {
  return requestJson<AlumniSummary>('/alumni/me', { method: 'PUT', json: payload })
}

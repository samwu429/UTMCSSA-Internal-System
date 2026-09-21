import { requestJson } from '@/shared/api/client/apiClient'
import type {
  AnnouncementCreate,
  AnnouncementSummary,
} from '@/shared/api/contracts/activities/activity'
import type { UuidString } from '@/shared/api/contracts/common/scalarTypes'

export function fetchAnnouncements(
  departmentId: UuidString | undefined,
  signal?: AbortSignal,
): Promise<AnnouncementSummary[]> {
  return requestJson<AnnouncementSummary[]>('/announcements', {
    query: { department_id: departmentId },
    signal,
  })
}

export function createAnnouncement(
  payload: AnnouncementCreate,
): Promise<AnnouncementSummary> {
  return requestJson<AnnouncementSummary>('/announcements', { method: 'POST', json: payload })
}

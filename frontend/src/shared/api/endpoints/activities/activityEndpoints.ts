import { requestJson, requestNoContent } from '@/shared/api/client/apiClient'
import type {
  ActivityCreate,
  ActivityDetail,
  ActivityPublishRequest,
  ActivityQuery,
  ActivitySummary,
  ActivityUpdate,
} from '@/shared/api/contracts/activities/activity'
import type { UuidString } from '@/shared/api/contracts/common/scalarTypes'

export function fetchActivities(
  query: ActivityQuery,
  signal?: AbortSignal,
): Promise<ActivitySummary[]> {
  return requestJson<ActivitySummary[]>('/activities', { query: { ...query }, signal })
}

export function fetchActivityDetail(
  activityId: UuidString,
  signal?: AbortSignal,
): Promise<ActivityDetail> {
  return requestJson<ActivityDetail>(`/activities/${activityId}`, { signal })
}

export function createActivity(payload: ActivityCreate): Promise<ActivityDetail> {
  return requestJson<ActivityDetail>('/activities', { method: 'POST', json: payload })
}

export function updateActivity(
  activityId: UuidString,
  payload: ActivityUpdate,
): Promise<ActivityDetail> {
  return requestJson<ActivityDetail>(`/activities/${activityId}`, {
    method: 'PATCH',
    json: payload,
  })
}

export function publishActivity(
  activityId: UuidString,
  payload: ActivityPublishRequest,
): Promise<ActivityDetail> {
  return requestJson<ActivityDetail>(`/activities/${activityId}/publish`, {
    method: 'POST',
    json: payload,
  })
}

export function deleteActivity(activityId: UuidString): Promise<void> {
  return requestNoContent(`/activities/${activityId}`, { method: 'DELETE' })
}

import { requestJson } from '@/shared/api/client/apiClient'
import type { NotificationPreferenceUpdate } from '@/shared/api/contracts/directory/member'
import type { SessionProfile } from '@/shared/api/contracts/identity/sessionProfile'

export function fetchSessionProfile(signal?: AbortSignal): Promise<SessionProfile> {
  return requestJson<SessionProfile>('/auth/me', { signal })
}

export function updateNotificationPreferences(
  payload: NotificationPreferenceUpdate,
): Promise<SessionProfile> {
  return requestJson<SessionProfile>('/auth/me/preferences', {
    method: 'PATCH',
    json: payload,
  })
}

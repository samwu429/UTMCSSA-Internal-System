import { requestJson } from '@/shared/api/client/apiClient'
import type { PaginationQuery } from '@/shared/api/contracts/common/pagination'
import type {
  BroadcastRequest,
  BroadcastResult,
  DailyDigestContent,
  EmailDeliveryRecord,
} from '@/shared/api/contracts/notifications/messaging'

export function sendBroadcast(payload: BroadcastRequest): Promise<BroadcastResult> {
  return requestJson<BroadcastResult>('/notifications/broadcast', {
    method: 'POST',
    json: payload,
  })
}

export function fetchEmailDeliveries(
  query: PaginationQuery,
  signal?: AbortSignal,
): Promise<EmailDeliveryRecord[]> {
  return requestJson<EmailDeliveryRecord[]>('/notifications/deliveries', {
    query: { ...query },
    signal,
  })
}

export function previewDailyDigest(signal?: AbortSignal): Promise<DailyDigestContent> {
  return requestJson<DailyDigestContent>('/notifications/daily-digest/preview', {
    method: 'POST',
    signal,
  })
}

import type { QueryParameterValue } from '@/shared/api/client/serialization/buildQueryString'

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export interface ApiRequestOptions {
  method?: HttpMethod
  query?: Record<string, QueryParameterValue>
  /** JSON request body; mutually exclusive with `multipart`. */
  json?: unknown
  /** Multipart body for file uploads; the browser supplies the boundary header itself. */
  multipart?: FormData
  /**
   * Set to false for the credential endpoints, which must never trigger a refresh attempt on the
   * 401 they legitimately return for bad credentials.
   *
   * 凭据类接口须设为 false：其 401 表示凭据错误，不应触发刷新重试。
   */
  authenticated?: boolean
  accept?: string
  signal?: AbortSignal
}

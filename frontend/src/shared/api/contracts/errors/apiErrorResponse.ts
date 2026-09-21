/**
 * The single error envelope every endpoint returns on failure.
 *
 * Both languages travel with the error, which is why the interface never maintains its own
 * translation table for backend failures.
 *
 * 错误响应携带中英双语文案，因此前端无需为后端失败自建翻译表。
 */
export interface ApiErrorBody {
  code: string
  message_en: string
  message_zh: string
  details: Record<string, unknown>
}

export interface ApiErrorResponse {
  error: ApiErrorBody
}

export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (typeof value !== 'object' || value === null || !('error' in value)) {
    return false
  }
  const candidate = (value as { error: unknown }).error
  return typeof candidate === 'object' && candidate !== null && 'code' in candidate
}

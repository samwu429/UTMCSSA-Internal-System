import { ApiRequestError } from '@/shared/api/client/errors/ApiRequestError'

const GENERIC_FAILURE_MESSAGE = '操作未能完成，请稍后重试。'
const NETWORK_FAILURE_MESSAGE = '无法连接服务器，请检查网络后重试。'

/**
 * Pick the Chinese message the member should read, falling back to English and then to a generic
 * sentence, so no raw exception text ever reaches the interface.
 *
 * 优先展示中文文案，其次英文，最后回退到通用提示，确保界面不会出现原始异常文本。
 */
export function resolveErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.body) {
      return error.body.message_zh || error.body.message_en || GENERIC_FAILURE_MESSAGE
    }
    return error.status === 0 ? NETWORK_FAILURE_MESSAGE : GENERIC_FAILURE_MESSAGE
  }
  return GENERIC_FAILURE_MESSAGE
}

/**
 * Field-level validation hints the backend attaches under `details.field`.
 *
 * 后端在 details.field 中给出的字段级校验提示。
 */
export function resolveInvalidFieldName(error: unknown): string | null {
  if (!(error instanceof ApiRequestError)) {
    return null
  }
  const field = error.details.field
  return typeof field === 'string' ? field : null
}

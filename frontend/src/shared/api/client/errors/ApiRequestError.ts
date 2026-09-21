import type { ApiErrorBody } from '@/shared/api/contracts/errors/apiErrorResponse'

/**
 * A failed API call carrying the backend's bilingual explanation.
 *
 * `body` is absent when the failure happened below the application layer, for example a dropped
 * connection or a gateway returning HTML.
 *
 * 当故障发生在应用层之下（连接中断、网关返回 HTML 等）时 body 为空。
 */
export class ApiRequestError extends Error {
  readonly status: number
  readonly body: ApiErrorBody | null

  constructor(message: string, status: number, body: ApiErrorBody | null) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.body = body
  }

  get code(): string {
    return this.body?.code ?? 'network_error'
  }

  get details(): Record<string, unknown> {
    return this.body?.details ?? {}
  }
}

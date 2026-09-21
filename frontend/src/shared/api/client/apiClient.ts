import {
  clearStoredTokens,
} from '@/shared/api/client/credentials/tokenStorage'
import { notifySessionExpired } from '@/shared/api/client/credentials/sessionExpiryNotifier'
import { ApiRequestError } from '@/shared/api/client/errors/ApiRequestError'
import { applyAuthorizationHeader } from '@/shared/api/client/interceptors/authorizationHeader'
import { refreshAccessToken } from '@/shared/api/client/interceptors/refreshOnUnauthorized'
import type { ApiRequestOptions } from '@/shared/api/client/requestOptions'
import { buildQueryString } from '@/shared/api/client/serialization/buildQueryString'
import { apiBaseUrl } from '@/shared/api/configuration/environment'
import { isApiErrorResponse } from '@/shared/api/contracts/errors/apiErrorResponse'

const NO_CONTENT_STATUS = 204

function buildRequestHeaders(options: ApiRequestOptions, authenticated: boolean): Headers {
  const headers = new Headers()
  headers.set('Accept', options.accept ?? 'application/json')

  // Multipart bodies must keep the boundary the browser generates, so no content type is set.
  // multipart 请求需保留浏览器生成的分隔符，因此不手动设置 Content-Type。
  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (authenticated) {
    applyAuthorizationHeader(headers)
  }

  return headers
}

function buildRequestBody(options: ApiRequestOptions): BodyInit | undefined {
  if (options.multipart !== undefined) {
    return options.multipart
  }
  if (options.json !== undefined) {
    return JSON.stringify(options.json)
  }
  return undefined
}

async function readErrorBody(response: Response): Promise<ApiRequestError> {
  let parsed: unknown = null
  try {
    parsed = await response.json()
  } catch {
    parsed = null
  }

  if (isApiErrorResponse(parsed)) {
    return new ApiRequestError(parsed.error.message_en, response.status, parsed.error)
  }
  return new ApiRequestError(response.statusText || 'Request failed', response.status, null)
}

async function executeRequest(
  path: string,
  options: ApiRequestOptions,
  refreshAllowed: boolean,
): Promise<Response> {
  const authenticated = options.authenticated ?? true
  const url = `${apiBaseUrl}${path}${buildQueryString(options.query ?? {})}`

  let response: Response
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: buildRequestHeaders(options, authenticated),
      body: buildRequestBody(options),
      signal: options.signal,
    })
  } catch {
    throw new ApiRequestError('The server could not be reached.', 0, null)
  }

  if (response.status !== 401 || !authenticated || !refreshAllowed) {
    return response
  }

  // Exactly one refresh attempt per original request; a second 401 means the session is gone.
  // 每个原始请求只尝试刷新一次；若仍返回 401 则视为会话已失效。
  const refreshed = await refreshAccessToken()
  if (refreshed === null) {
    clearStoredTokens()
    notifySessionExpired()
    return response
  }

  const retried = await executeRequest(path, options, false)
  if (retried.status === 401) {
    clearStoredTokens()
    notifySessionExpired()
  }
  return retried
}

async function requestSuccessfulResponse(
  path: string,
  options: ApiRequestOptions,
): Promise<Response> {
  const response = await executeRequest(path, options, true)
  if (!response.ok) {
    throw await readErrorBody(response)
  }
  return response
}

/** Perform a request whose success body is JSON. */
export async function requestJson<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const response = await requestSuccessfulResponse(path, options)
  if (response.status === NO_CONTENT_STATUS) {
    return undefined as TResponse
  }
  return (await response.json()) as TResponse
}

/** Perform a request that answers with 204 and carries no body. */
export async function requestNoContent(
  path: string,
  options: ApiRequestOptions = {},
): Promise<void> {
  await requestSuccessfulResponse(path, options)
}

/** Perform a request whose success body is a file stream, such as the member roster export. */
export async function requestBlob(
  path: string,
  options: ApiRequestOptions = {},
): Promise<Blob> {
  const response = await requestSuccessfulResponse(path, { accept: '*/*', ...options })
  return await response.blob()
}

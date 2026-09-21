import { readAccessToken } from '@/shared/api/client/credentials/tokenStorage'

/**
 * Attach the bearer credential when one is held.
 *
 * 持有凭据时附加 Bearer 认证头。
 */
export function applyAuthorizationHeader(headers: Headers): void {
  const accessToken = readAccessToken()
  if (accessToken !== null) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }
}

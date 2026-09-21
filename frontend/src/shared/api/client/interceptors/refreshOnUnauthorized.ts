import {
  readRefreshToken,
  storeTokenPair,
} from '@/shared/api/client/credentials/tokenStorage'
import { apiBaseUrl } from '@/shared/api/configuration/environment'
import type { TokenPair } from '@/shared/api/contracts/identity/authentication'

/**
 * Concurrent requests that all hit an expired access token must produce one refresh call, not one
 * per request: the backend rotates the refresh token, so a second concurrent exchange would
 * present a token the first exchange already consumed and invalidate the session.
 *
 * 多个并发请求同时遇到过期访问令牌时只能触发一次刷新：后端会轮换刷新令牌，
 * 第二次并发交换将使用已被首次交换消耗的令牌，反而会使会话失效。
 */
let inFlightRefresh: Promise<TokenPair | null> | null = null

async function exchangeRefreshToken(refreshToken: string): Promise<TokenPair | null> {
  try {
    const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) {
      return null
    }

    const tokens = (await response.json()) as TokenPair
    storeTokenPair(tokens)
    return tokens
  } catch {
    return null
  }
}

export function refreshAccessToken(): Promise<TokenPair | null> {
  if (inFlightRefresh !== null) {
    return inFlightRefresh
  }

  const refreshToken = readRefreshToken()
  if (refreshToken === null) {
    return Promise.resolve(null)
  }

  inFlightRefresh = exchangeRefreshToken(refreshToken).finally(() => {
    inFlightRefresh = null
  })

  return inFlightRefresh
}

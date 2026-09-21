import {
  ACCESS_TOKEN_EXPIRY_STORAGE_KEY,
  ACCESS_TOKEN_STORAGE_KEY,
  LANDING_PATH_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
} from '@/shared/api/client/credentials/storageKeys'
import type { TokenPair } from '@/shared/api/contracts/identity/authentication'

/**
 * Token custody for the whole application.
 *
 * The access token lives in a module variable so the common path never touches `localStorage`,
 * and is mirrored there only so a page reload can resume the session. Both copies are cleared
 * together; a member who signed out must not be resurrected by a stale storage entry.
 *
 * 访问令牌保存在模块变量中，常规请求无需访问 localStorage；同时镜像写入存储，
 * 仅用于页面刷新后恢复会话。两份副本始终同步清除，避免残留条目让已登出的成员被重新登录。
 */
let accessTokenInMemory: string | null = null

function readFromStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeToStorage(key: string, value: string | null): void {
  try {
    if (value === null) {
      window.localStorage.removeItem(key)
      return
    }
    window.localStorage.setItem(key, value)
  } catch {
    // Storage can be unavailable in private browsing modes; the in-memory copy keeps the current
    // tab working, and the member simply signs in again after a reload.
    // 隐私模式下存储可能不可用；内存副本足以支撑当前标签页，刷新后重新登录即可。
  }
}

export function readAccessToken(): string | null {
  if (accessTokenInMemory !== null) {
    return accessTokenInMemory
  }
  accessTokenInMemory = readFromStorage(ACCESS_TOKEN_STORAGE_KEY)
  return accessTokenInMemory
}

export function readRefreshToken(): string | null {
  return readFromStorage(REFRESH_TOKEN_STORAGE_KEY)
}

export function readAccessTokenExpiry(): string | null {
  return readFromStorage(ACCESS_TOKEN_EXPIRY_STORAGE_KEY)
}

export function readLandingPath(): string | null {
  return readFromStorage(LANDING_PATH_STORAGE_KEY)
}

export function storeTokenPair(tokens: TokenPair): void {
  accessTokenInMemory = tokens.access_token
  writeToStorage(ACCESS_TOKEN_STORAGE_KEY, tokens.access_token)
  writeToStorage(REFRESH_TOKEN_STORAGE_KEY, tokens.refresh_token)
  writeToStorage(ACCESS_TOKEN_EXPIRY_STORAGE_KEY, tokens.access_token_expires_at)
  writeToStorage(LANDING_PATH_STORAGE_KEY, tokens.landing_path)
}

export function clearStoredTokens(): void {
  accessTokenInMemory = null
  writeToStorage(ACCESS_TOKEN_STORAGE_KEY, null)
  writeToStorage(REFRESH_TOKEN_STORAGE_KEY, null)
  writeToStorage(ACCESS_TOKEN_EXPIRY_STORAGE_KEY, null)
  writeToStorage(LANDING_PATH_STORAGE_KEY, null)
}

export function hasStoredCredentials(): boolean {
  return readAccessToken() !== null || readRefreshToken() !== null
}

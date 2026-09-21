import type { IsoDateTimeString } from '@/shared/api/contracts/common/scalarTypes'

export interface LoginRequest {
  email: string
  password: string
}

/**
 * Issued on sign-in and on every refresh. `landing_path` is computed server-side from the member's
 * primary department, so the browser never infers which portal an account belongs to.
 *
 * landing_path 由服务端依据主归属部门计算，浏览器无需自行推断应进入哪个门户。
 */
export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
  access_token_expires_at: IsoDateTimeString
  refresh_token_expires_at: IsoDateTimeString
  landing_path: string
}

export interface RefreshRequest {
  refresh_token: string
}

export interface LogoutRequest {
  refresh_token?: string | null
  all_sessions?: boolean
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetConfirmation {
  email: string
  code: string
  new_password: string
}

export interface PasswordChangeRequest {
  current_password: string
  new_password: string
}

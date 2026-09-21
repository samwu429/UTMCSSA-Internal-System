import { requestJson, requestNoContent } from '@/shared/api/client/apiClient'
import type {
  LoginRequest,
  LogoutRequest,
  PasswordChangeRequest,
  PasswordResetConfirmation,
  PasswordResetRequest,
  TokenPair,
} from '@/shared/api/contracts/identity/authentication'

export function signIn(payload: LoginRequest): Promise<TokenPair> {
  return requestJson<TokenPair>('/auth/login', {
    method: 'POST',
    json: payload,
    authenticated: false,
  })
}

export function signOut(payload: LogoutRequest): Promise<void> {
  return requestNoContent('/auth/logout', { method: 'POST', json: payload })
}

export function requestPasswordReset(payload: PasswordResetRequest): Promise<void> {
  return requestNoContent('/auth/password-reset/request', {
    method: 'POST',
    json: payload,
    authenticated: false,
  })
}

export function confirmPasswordReset(payload: PasswordResetConfirmation): Promise<void> {
  return requestNoContent('/auth/password-reset/confirm', {
    method: 'POST',
    json: payload,
    authenticated: false,
  })
}

export function changeOwnPassword(payload: PasswordChangeRequest): Promise<void> {
  return requestNoContent('/auth/me/password', { method: 'POST', json: payload })
}

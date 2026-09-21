import { requestJson } from '@/shared/api/client/apiClient'
import type {
  RegistrationAccepted,
  RegistrationRequest,
  VerificationCodeIssued,
  VerificationCodeRequest,
  VerificationCodeSubmission,
  VerificationResult,
} from '@/shared/api/contracts/identity/registration'

export function submitRegistration(
  payload: RegistrationRequest,
): Promise<RegistrationAccepted> {
  return requestJson<RegistrationAccepted>('/auth/register', {
    method: 'POST',
    json: payload,
    authenticated: false,
  })
}

export function requestVerificationCode(
  payload: VerificationCodeRequest,
): Promise<VerificationCodeIssued> {
  return requestJson<VerificationCodeIssued>('/auth/verification-codes', {
    method: 'POST',
    json: payload,
    authenticated: false,
  })
}

export function submitVerificationCode(
  payload: VerificationCodeSubmission,
): Promise<VerificationResult> {
  return requestJson<VerificationResult>('/auth/verify', {
    method: 'POST',
    json: payload,
    authenticated: false,
  })
}

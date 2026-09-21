import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { routePaths } from '@/app/routing/routePaths'
import { useSession } from '@/features/authentication/session/context/useSession'
import {
  forgetPendingVerificationEmail,
  readPendingVerificationEmail,
} from '@/features/authentication/verification/storage/pendingVerificationEmail'
import { resolveErrorMessage } from '@/shared/api/client/errors/resolveErrorMessage'
import { VerificationPurpose } from '@/shared/api/contracts/identity/accountLifecycle'
import type {
  VerificationCodeIssued,
  VerificationResult,
} from '@/shared/api/contracts/identity/registration'
import {
  requestVerificationCode,
  submitVerificationCode,
} from '@/shared/api/endpoints/identity/registrationEndpoints'
import { useSecondsCountdown } from '@/shared/hooks/useSecondsCountdown'
import { formatDateTime } from '@/shared/formatting/dateTime/formatDateTime'
import { Button } from '@/shared/ui/primitives/button/Button'
import { TextField } from '@/shared/ui/primitives/field/TextField'

const VERIFICATION_CODE_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 60

export function VerificationCodeForm() {
  const navigate = useNavigate()
  const { profile, hasStoredSession, reloadProfile } = useSession()
  const [email, setEmail] = useState(
    () => profile?.email ?? readPendingVerificationEmail(),
  )
  const [code, setCode] = useState('')
  const [failureMessage, setFailureMessage] = useState<string | null>(null)
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null)
  const resendCountdown = useSecondsCountdown(0)

  const resendMutation = useMutation<VerificationCodeIssued, unknown, void>({
    mutationFn: () =>
      requestVerificationCode({
        email: email.trim().toLowerCase(),
        purpose: VerificationPurpose.REGISTRATION,
      }),
    onSuccess: (issued) => {
      setFailureMessage(null)
      setNoticeMessage(`验证码已重新发送，有效期至 ${formatDateTime(issued.expires_at)}。`)
      resendCountdown.restart(RESEND_COOLDOWN_SECONDS)
    },
    onError: (error) => {
      setFailureMessage(resolveErrorMessage(error))
    },
  })

  const verifyMutation = useMutation<VerificationResult, unknown, void>({
    mutationFn: () =>
      submitVerificationCode({
        email: email.trim().toLowerCase(),
        code: code.trim(),
        purpose: VerificationPurpose.REGISTRATION,
      }),
    onSuccess: (result) => {
      forgetPendingVerificationEmail()
      if (hasStoredSession) {
        reloadProfile()
      }
      void navigate(result.awaiting_approval ? routePaths.awaitingApproval : routePaths.login, {
        replace: true,
      })
    },
    onError: (error) => {
      setFailureMessage(resolveErrorMessage(error))
    },
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFailureMessage(null)
    setNoticeMessage(null)
    verifyMutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <TextField
        label="注册邮箱"
        type="email"
        name="email"
        autoComplete="username"
        required
        value={email}
        readOnly={profile !== null}
        hint={profile !== null ? '当前账号的注册邮箱。' : '请填写收到验证码的邮箱地址。'}
        onChange={(event) => {
          setEmail(event.target.value)
        }}
      />

      <TextField
        label="6 位验证码"
        name="verification-code"
        inputMode="numeric"
        autoComplete="one-time-code"
        required
        maxLength={VERIFICATION_CODE_LENGTH}
        value={code}
        hint="验证码有效期为 15 分钟，若已过期请点击下方重新发送。"
        placeholder="000000"
        onChange={(event) => {
          setCode(event.target.value.replace(/\D/g, ''))
        }}
      />

      {noticeMessage !== null ? (
        <p
          className="rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-700"
          role="status"
        >
          {noticeMessage}
        </p>
      ) : null}

      {failureMessage !== null ? (
        <p
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {failureMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          variant="primary"
          size="large"
          disabled={code.length < VERIFICATION_CODE_LENGTH}
          isBusy={verifyMutation.isPending}
          busyLabel="正在验证…"
        >
          验证邮箱
        </Button>

        <Button
          size="large"
          disabled={resendCountdown.isRunning || email.trim() === ''}
          isBusy={resendMutation.isPending}
          busyLabel="正在发送…"
          onClick={() => {
            setNoticeMessage(null)
            setFailureMessage(null)
            resendMutation.mutate()
          }}
        >
          {resendCountdown.isRunning
            ? `重新发送（${resendCountdown.remainingSeconds} 秒）`
            : '重新发送验证码'}
        </Button>
      </div>
    </form>
  )
}

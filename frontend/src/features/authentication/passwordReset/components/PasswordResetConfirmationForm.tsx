import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { routePaths } from '@/app/routing/routePaths'
import {
  forgetPendingVerificationEmail,
  readPendingVerificationEmail,
} from '@/features/authentication/verification/storage/pendingVerificationEmail'
import { resolveErrorMessage } from '@/shared/api/client/errors/resolveErrorMessage'
import { confirmPasswordReset } from '@/shared/api/endpoints/identity/authenticationEndpoints'
import { describePasswordError } from '@/shared/security/passwords/passwordPolicy'
import { PasswordRequirements } from '@/shared/security/passwords/PasswordRequirements'
import { Button } from '@/shared/ui/primitives/button/Button'
import { TextField } from '@/shared/ui/primitives/field/TextField'

const VERIFICATION_CODE_LENGTH = 6

export function PasswordResetConfirmationForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState(() => readPendingVerificationEmail())
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [failureMessage, setFailureMessage] = useState<string | null>(null)

  const passwordError = describePasswordError(newPassword)

  const confirmationError =
    passwordConfirmation !== '' && passwordConfirmation !== newPassword
      ? '两次输入的密码不一致。'
      : null

  const confirmMutation = useMutation<void, unknown, void>({
    mutationFn: () =>
      confirmPasswordReset({
        email: email.trim().toLowerCase(),
        code: code.trim(),
        new_password: newPassword,
      }),
    onSuccess: () => {
      forgetPendingVerificationEmail()
      void navigate(routePaths.login, { replace: true })
    },
    onError: (error) => {
      setFailureMessage(resolveErrorMessage(error))
    },
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFailureMessage(null)
    if (passwordError !== null || confirmationError !== null) {
      return
    }
    confirmMutation.mutate()
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
        onChange={(event) => {
          setEmail(event.target.value)
        }}
      />

      <TextField
        label="6 位验证码"
        name="reset-code"
        inputMode="numeric"
        autoComplete="one-time-code"
        required
        maxLength={VERIFICATION_CODE_LENGTH}
        value={code}
        placeholder="000000"
        onChange={(event) => {
          setCode(event.target.value.replace(/\D/g, ''))
        }}
      />

      <TextField
        label="新密码"
        type="password"
        name="new-password"
        autoComplete="new-password"
        required
        value={newPassword}
        errorMessage={passwordError}
        hint={<PasswordRequirements candidate={newPassword} />}
        onChange={(event) => {
          setNewPassword(event.target.value)
        }}
      />

      <TextField
        label="确认新密码"
        type="password"
        name="confirm-password"
        autoComplete="new-password"
        required
        value={passwordConfirmation}
        errorMessage={confirmationError}
        onChange={(event) => {
          setPasswordConfirmation(event.target.value)
        }}
      />

      {failureMessage !== null ? (
        <p
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {failureMessage}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        size="large"
        isBusy={confirmMutation.isPending}
        busyLabel="正在提交…"
      >
        设置新密码
      </Button>
    </form>
  )
}

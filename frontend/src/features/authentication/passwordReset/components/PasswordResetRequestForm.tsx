import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { routePaths } from '@/app/routing/routePaths'
import { rememberPendingVerificationEmail } from '@/features/authentication/verification/storage/pendingVerificationEmail'
import { resolveErrorMessage } from '@/shared/api/client/errors/resolveErrorMessage'
import { requestPasswordReset } from '@/shared/api/endpoints/identity/authenticationEndpoints'
import { Button } from '@/shared/ui/primitives/button/Button'
import { TextField } from '@/shared/ui/primitives/field/TextField'

export function PasswordResetRequestForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [failureMessage, setFailureMessage] = useState<string | null>(null)

  const requestMutation = useMutation<void, unknown, void>({
    mutationFn: () => requestPasswordReset({ email: email.trim().toLowerCase() }),
    onSuccess: () => {
      rememberPendingVerificationEmail(email.trim().toLowerCase())
      void navigate(routePaths.resetPassword)
    },
    onError: (error) => {
      setFailureMessage(resolveErrorMessage(error))
    },
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFailureMessage(null)
    requestMutation.mutate()
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
        hint="若该邮箱已注册，系统会发送一封包含重置验证码的邮件。"
        placeholder="name@mail.utoronto.ca"
        onChange={(event) => {
          setEmail(event.target.value)
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
        isBusy={requestMutation.isPending}
        busyLabel="正在发送…"
      >
        发送重置验证码
      </Button>
    </form>
  )
}

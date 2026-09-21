import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { routePaths } from '@/app/routing/routePaths'
import { useSession } from '@/features/authentication/session/context/useSession'
import { resolveErrorMessage } from '@/shared/api/client/errors/resolveErrorMessage'
import type { TokenPair } from '@/shared/api/contracts/identity/authentication'
import { Button } from '@/shared/ui/primitives/button/Button'
import { TextField } from '@/shared/ui/primitives/field/TextField'

interface SignInLocationState {
  intendedPath?: string
}

export function SignInForm() {
  const { signIn } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [failureMessage, setFailureMessage] = useState<string | null>(null)

  const signInMutation = useMutation<TokenPair, unknown, void>({
    mutationFn: () => signIn({ email: email.trim(), password }),
    onSuccess: (tokens) => {
      // The guard records where the member was heading before being asked to sign in; the server's
      // landing path is used only when there was no such destination.
      // 守卫会记录成员被要求登录前的目标地址；仅在没有该目标时才使用服务端给出的落地路径。
      const intendedPath = (location.state as SignInLocationState | null)?.intendedPath
      void navigate(intendedPath ?? tokens.landing_path, { replace: true })
    },
    onError: (error) => {
      setFailureMessage(resolveErrorMessage(error))
    },
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFailureMessage(null)
    signInMutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <TextField
        label="学校邮箱"
        type="email"
        name="email"
        autoComplete="username"
        required
        value={email}
        placeholder="name@mail.utoronto.ca"
        onChange={(event) => {
          setEmail(event.target.value)
        }}
      />

      <TextField
        label="密码"
        type="password"
        name="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => {
          setPassword(event.target.value)
        }}
      />

      {failureMessage !== null ? (
        <p className="border border-[#e2b4ae] bg-[var(--danger-soft)] px-3 py-2 text-[13px] text-[var(--danger)]" role="alert">
          {failureMessage}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <Button
          type="submit"
          variant="primary"
          size="large"
          isBusy={signInMutation.isPending}
          busyLabel="正在登录…"
        >
          登录
        </Button>
        <Link
          to={routePaths.forgotPassword}
          className="text-[13px] text-[var(--ink-muted)] underline underline-offset-2 hover:text-[var(--ink)]"
        >
          忘记密码
        </Link>
      </div>
    </form>
  )
}

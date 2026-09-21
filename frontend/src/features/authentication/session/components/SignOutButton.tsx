import { useState } from 'react'
import { useNavigate } from 'react-router'
import { routePaths } from '@/app/routing/routePaths'
import { useSession } from '@/features/authentication/session/context/useSession'
import { Button } from '@/shared/ui/primitives/button/Button'
import type { ButtonSize, ButtonVariant } from '@/shared/ui/primitives/button/buttonStyles'

export interface SignOutButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function SignOutButton({ variant = 'secondary', size = 'small' }: SignOutButtonProps) {
  const { signOut } = useSession()
  const navigate = useNavigate()
  const [isSigningOut, setIsSigningOut] = useState(false)

  return (
    <Button
      variant={variant}
      size={size}
      isBusy={isSigningOut}
      busyLabel="正在退出…"
      onClick={() => {
        setIsSigningOut(true)
        void signOut().finally(() => {
          setIsSigningOut(false)
          void navigate(routePaths.login, { replace: true })
        })
      }}
    >
      退出登录
    </Button>
  )
}

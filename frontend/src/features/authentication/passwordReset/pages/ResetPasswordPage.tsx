import { routePaths } from '@/app/routing/routePaths'
import { PasswordResetConfirmationForm } from '@/features/authentication/passwordReset/components/PasswordResetConfirmationForm'
import { AuthenticationLayout } from '@/features/authentication/shared/layout/AuthenticationLayout'
import { TextualLink } from '@/features/authentication/shared/layout/TextualLink'

export function ResetPasswordPage() {
  return (
    <AuthenticationLayout
      title="设置新密码"
      englishTitle="Reset password"
      description="输入邮件中的验证码并设置新密码。完成后请使用新密码重新登录。"
      footer={
        <span>
          没有收到验证码？<TextualLink to={routePaths.forgotPassword}>重新发送</TextualLink>
        </span>
      }
    >
      <PasswordResetConfirmationForm />
    </AuthenticationLayout>
  )
}

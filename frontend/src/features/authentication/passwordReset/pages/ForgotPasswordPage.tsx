import { routePaths } from '@/app/routing/routePaths'
import { PasswordResetRequestForm } from '@/features/authentication/passwordReset/components/PasswordResetRequestForm'
import { AuthenticationLayout } from '@/features/authentication/shared/layout/AuthenticationLayout'
import { TextualLink } from '@/features/authentication/shared/layout/TextualLink'

export function ForgotPasswordPage() {
  return (
    <AuthenticationLayout
      title="重置密码"
      englishTitle="Forgot password"
      description="填写注册时使用的学校邮箱，我们会发送一次性验证码用于设置新密码。"
      footer={
        <span>
          想起密码了？<TextualLink to={routePaths.login}>返回登录</TextualLink>
        </span>
      }
    >
      <PasswordResetRequestForm />
    </AuthenticationLayout>
  )
}

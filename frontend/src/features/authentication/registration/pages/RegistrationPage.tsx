import { routePaths } from '@/app/routing/routePaths'
import { RegistrationForm } from '@/features/authentication/registration/components/RegistrationForm'
import { AuthenticationLayout } from '@/features/authentication/shared/layout/AuthenticationLayout'
import { TextualLink } from '@/features/authentication/shared/layout/TextualLink'

export function RegistrationPage() {
  return (
    <AuthenticationLayout
      title="注册申请"
      englishTitle="Register"
      description="提交后系统会向您的学校邮箱发送验证码。完成邮箱验证后，主席团会为您安排部门归属。"
      footer={
        <span>
          已有账号？<TextualLink to={routePaths.login}>返回登录</TextualLink>
        </span>
      }
    >
      <RegistrationForm />
    </AuthenticationLayout>
  )
}

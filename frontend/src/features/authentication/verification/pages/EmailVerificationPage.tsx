import { routePaths } from '@/app/routing/routePaths'
import { AuthenticationLayout } from '@/features/authentication/shared/layout/AuthenticationLayout'
import { TextualLink } from '@/features/authentication/shared/layout/TextualLink'
import { VerificationCodeForm } from '@/features/authentication/verification/components/VerificationCodeForm'

export function EmailVerificationPage() {
  return (
    <AuthenticationLayout
      title="验证学校邮箱"
      englishTitle="Verify email"
      description="请输入发送到您学校邮箱的 6 位验证码。验证成功即可进入下一步。"
      footer={
        <span>
          填错了邮箱？<TextualLink to={routePaths.register}>重新提交注册申请</TextualLink>
        </span>
      }
    >
      <VerificationCodeForm />
    </AuthenticationLayout>
  )
}

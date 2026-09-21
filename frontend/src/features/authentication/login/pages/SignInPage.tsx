import { routePaths } from '@/app/routing/routePaths'
import { SignInForm } from '@/features/authentication/login/components/SignInForm'
import { AuthenticationLayout } from '@/features/authentication/shared/layout/AuthenticationLayout'
import { TextualLink } from '@/features/authentication/shared/layout/TextualLink'

export function SignInPage() {
  return (
    <AuthenticationLayout
      title="登录"
      englishTitle="Sign in"
      description="使用注册时的多伦多大学邮箱登录，系统会自动带您进入所属部门的门户。"
      footer={
        <span>
          还没有账号？<TextualLink to={routePaths.register}>提交注册申请</TextualLink>
        </span>
      }
    >
      <SignInForm />
    </AuthenticationLayout>
  )
}

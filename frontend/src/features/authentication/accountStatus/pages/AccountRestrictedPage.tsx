import { routePaths } from '@/app/routing/routePaths'
import { SignOutButton } from '@/features/authentication/session/components/SignOutButton'
import { useSession } from '@/features/authentication/session/context/useSession'
import { AuthenticationLayout } from '@/features/authentication/shared/layout/AuthenticationLayout'
import { TextualLink } from '@/features/authentication/shared/layout/TextualLink'
import { AccountStatus } from '@/shared/api/contracts/identity/accountLifecycle'

interface RestrictionCopy {
  title: string
  englishTitle: string
  description: string
  explanation: string
}

const suspendedCopy: RestrictionCopy = {
  title: '账号已停用',
  englishTitle: 'Account suspended',
  description: '该账号目前处于停用状态，暂时无法进入部门门户。',
  explanation:
    '账号通常在成员任期结束、或应本人要求时被停用。如果您认为这是误操作，或您已重新加入某个部门，请联系主席团成员或行政部为您恢复账号。',
}

const rejectedCopy: RestrictionCopy = {
  title: '注册申请未通过',
  englishTitle: 'Registration declined',
  description: '主席团未通过该邮箱的注册申请。',
  explanation:
    '拒绝原因已随通知邮件发送至您的学校邮箱。若情况有变化（例如您已正式加入某个部门），可以联系该部门负责人后重新提交注册申请。',
}

export function AccountRestrictedPage() {
  const { profile } = useSession()
  const copy = profile?.status === AccountStatus.REJECTED ? rejectedCopy : suspendedCopy

  return (
    <AuthenticationLayout
      title={copy.title}
      englishTitle={copy.englishTitle}
      description={copy.description}
      footer={
        <span>
          需要使用其他账号？<TextualLink to={routePaths.login}>返回登录</TextualLink>
        </span>
      }
    >
      <div className="space-y-5">
        <p className="text-sm text-neutral-700">{copy.explanation}</p>

        {profile !== null ? (
          <dl className="grid grid-cols-1 gap-3 border-t border-neutral-200 pt-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-neutral-500">注册邮箱</dt>
              <dd className="mt-0.5 break-all text-neutral-900">{profile.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500">姓名</dt>
              <dd className="mt-0.5 text-neutral-900">{profile.display_name}</dd>
            </div>
          </dl>
        ) : null}

        <div className="border-t border-neutral-200 pt-4">
          <SignOutButton size="medium" />
        </div>
      </div>
    </AuthenticationLayout>
  )
}

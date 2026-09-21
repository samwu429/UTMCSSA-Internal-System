import { useNavigate } from 'react-router'
import { resolveLandingPath } from '@/app/routing/guards/resolveLandingPath'
import { routePaths } from '@/app/routing/routePaths'
import { SignOutButton } from '@/features/authentication/session/components/SignOutButton'
import { useSession } from '@/features/authentication/session/context/useSession'
import { AuthenticationLayout } from '@/features/authentication/shared/layout/AuthenticationLayout'
import { TextualLink } from '@/features/authentication/shared/layout/TextualLink'
import { AccountStatus } from '@/shared/api/contracts/identity/accountLifecycle'
import { Button } from '@/shared/ui/primitives/button/Button'

/**
 * Explains the human step between a verified mailbox and a department portal.
 *
 * The wait is not a system delay, so the copy names who is deciding and what they decide, rather
 * than asking the member to try again.
 *
 * 说明「邮箱已验证」与「进入部门门户」之间的人工环节。
 * 这段等待并非系统延迟，因此文案说明由谁决定、决定什么，而不是让成员反复重试。
 */
export function AwaitingApprovalPage() {
  const { profile, hasStoredSession, reloadProfile } = useSession()
  const navigate = useNavigate()

  const isAlreadyApproved = profile !== null && profile.status === AccountStatus.ACTIVE

  return (
    <AuthenticationLayout
      title="等待主席团审批"
      englishTitle="Awaiting approval"
      description="您的学校邮箱已验证成功。接下来由主席团确认您的部门归属，确认后账号即可使用。"
      footer={
        hasStoredSession ? (
          <span>不再等待？可先退出登录，稍后凭同一邮箱重新登录查看结果。</span>
        ) : (
          <span>
            审批通过后，请<TextualLink to={routePaths.login}>返回登录</TextualLink>进入部门门户。
          </span>
        )
      }
    >
      <div className="space-y-5">
        <ol className="space-y-3 text-sm text-neutral-700">
          <li className="flex gap-3">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-xs text-neutral-500">
              1
            </span>
            <span>
              <span className="font-medium text-neutral-900">提交注册申请</span>
              <span className="mt-0.5 block text-xs text-neutral-500">已完成</span>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-neutral-300 text-xs text-neutral-500">
              2
            </span>
            <span>
              <span className="font-medium text-neutral-900">验证学校邮箱</span>
              <span className="mt-0.5 block text-xs text-neutral-500">已完成</span>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-[var(--portal-accent)] text-xs text-[var(--portal-accent)]">
              3
            </span>
            <span>
              <span className="font-medium text-neutral-900">主席团安排部门归属</span>
              <span className="mt-0.5 block text-xs text-neutral-500">
                进行中。主席团成员会在管理后台的「待审批注册」中看到您的申请，并为您选择部门与权限。
              </span>
            </span>
          </li>
        </ol>

        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-600">
          <p>审批通过后，系统会向您的学校邮箱发送通知邮件，您也可以直接重新登录查看。</p>
          <p className="mt-1">
            如果等待时间较长，请通过日常联络方式联系所在部门的负责人确认申请状态。
          </p>
        </div>

        {profile !== null ? (
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
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

        <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-4">
          {hasStoredSession ? (
            <>
              <Button
                variant="primary"
                onClick={() => {
                  reloadProfile()
                  if (isAlreadyApproved) {
                    void navigate(resolveLandingPath(profile), { replace: true })
                  }
                }}
              >
                刷新审批状态
              </Button>
              <SignOutButton size="medium" />
            </>
          ) : null}
        </div>
      </div>
    </AuthenticationLayout>
  )
}

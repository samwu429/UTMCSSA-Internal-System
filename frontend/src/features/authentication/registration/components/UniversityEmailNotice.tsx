import {
  ALUMNI_EMAIL_DOMAINS,
  STUDENT_EMAIL_DOMAINS,
} from '@/features/authentication/registration/eligibility/universityEmailDomains'

/**
 * States the mailbox requirement before the form is filled in, because a rejection after typing a
 * full application is the most common source of confusion at sign-up.
 *
 * 在填写表单前先说明邮箱要求：填完整份申请后才被拒绝，是注册环节最常见的困惑来源。
 */
export function UniversityEmailNotice() {
  return (
    <div className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3">
      <p className="text-sm font-medium text-neutral-900">仅接受多伦多大学邮箱注册</p>
      <ul className="mt-2 space-y-1 text-xs text-neutral-600">
        <li>
          在校生：
          {STUDENT_EMAIL_DOMAINS.map((domain) => `@${domain}`).join('、')}
        </li>
        <li>
          毕业生：
          {ALUMNI_EMAIL_DOMAINS.map((domain) => `@${domain}`).join('、')}
        </li>
      </ul>
      <p className="mt-2 text-xs text-neutral-500">
        系统会根据邮箱域名自动判断您是在校生还是毕业生。其他邮箱地址无法完成注册。
      </p>
    </div>
  )
}

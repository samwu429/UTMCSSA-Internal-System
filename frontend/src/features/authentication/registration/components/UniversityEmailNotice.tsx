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
    <div className="border border-[var(--line)] bg-[var(--paper)] px-3 py-2.5">
      <p className="text-[13px] font-medium text-[var(--ink)]">仅接受多伦多大学邮箱</p>
      <ul className="mt-1.5 space-y-1 font-mono text-[11px] text-[var(--ink-muted)]">
        <li>在校生 {STUDENT_EMAIL_DOMAINS.map((domain) => `@${domain}`).join(' ')}</li>
        <li>毕业生 {ALUMNI_EMAIL_DOMAINS.map((domain) => `@${domain}`).join(' ')}</li>
      </ul>
    </div>
  )
}

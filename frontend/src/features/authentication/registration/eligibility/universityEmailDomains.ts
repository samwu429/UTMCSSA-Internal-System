import { AffiliationType } from '@/shared/api/contracts/identity/accountLifecycle'

/**
 * Domains the backend accepts at registration.
 *
 * The list is duplicated here only to explain the rule before the form is submitted; the server
 * remains the authority and rejects anything outside its own configuration.
 *
 * 此处复制该清单仅用于在提交前向成员解释规则；服务端仍是唯一权威，
 * 会拒绝其配置之外的任何地址。
 */
export const STUDENT_EMAIL_DOMAINS: readonly string[] = ['mail.utoronto.ca', 'utoronto.ca']

export const ALUMNI_EMAIL_DOMAINS: readonly string[] = ['alum.utoronto.ca', 'alumni.utoronto.ca']

export const ACCEPTED_EMAIL_DOMAINS: readonly string[] = [
  ...STUDENT_EMAIL_DOMAINS,
  ...ALUMNI_EMAIL_DOMAINS,
]

export function extractEmailDomain(email: string): string {
  const separatorIndex = email.lastIndexOf('@')
  return separatorIndex === -1 ? '' : email.slice(separatorIndex + 1).trim().toLowerCase()
}

export function classifyAffiliation(email: string): AffiliationType | null {
  const domain = extractEmailDomain(email)
  if (ALUMNI_EMAIL_DOMAINS.includes(domain)) {
    return AffiliationType.ALUMNUS
  }
  if (STUDENT_EMAIL_DOMAINS.includes(domain)) {
    return AffiliationType.STUDENT
  }
  return null
}

export function isAcceptedUniversityEmail(email: string): boolean {
  return ACCEPTED_EMAIL_DOMAINS.includes(extractEmailDomain(email))
}

export const acceptedDomainsSentence = ACCEPTED_EMAIL_DOMAINS.map(
  (domain) => `@${domain}`,
).join('、')

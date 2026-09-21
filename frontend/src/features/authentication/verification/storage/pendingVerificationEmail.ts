const PENDING_VERIFICATION_EMAIL_KEY = 'utmcssa.pending_verification_email'

/**
 * Carries the address between sign-up and the code screen.
 *
 * Session storage is deliberate: the handover is meaningful only for the tab that just registered,
 * and it must not survive the browser being closed.
 *
 * 使用 sessionStorage 是有意的：该交接只对刚完成注册的标签页有意义，
 * 且不应在浏览器关闭后继续存在。
 */
export function rememberPendingVerificationEmail(email: string): void {
  try {
    window.sessionStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, email)
  } catch {
    // Without storage the member simply retypes the address on the verification screen.
    // 存储不可用时，成员在验证页面重新输入邮箱即可。
  }
}

export function readPendingVerificationEmail(): string {
  try {
    return window.sessionStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY) ?? ''
  } catch {
    return ''
  }
}

export function forgetPendingVerificationEmail(): void {
  try {
    window.sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY)
  } catch {
    // Nothing to clean up when storage is unavailable.
    // 存储不可用时无需清理。
  }
}

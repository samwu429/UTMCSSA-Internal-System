/**
 * Every address the interface can navigate to, built in one place so a renamed segment cannot
 * leave a stale link behind.
 *
 * 集中定义界面可跳转的全部地址，避免某处改名后遗留失效链接。
 */
export const routePaths = {
  root: '/',
  login: '/login',
  register: '/register',
  verifyEmail: '/verify-email',
  awaitingApproval: '/awaiting-approval',
  accountRestricted: '/account-restricted',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  portalRoot: (departmentSlug: string) => `/portal/${departmentSlug}`,
  portalSection: (departmentSlug: string, segment: string) =>
    segment === '' ? `/portal/${departmentSlug}` : `/portal/${departmentSlug}/${segment}`,
} as const

export const PORTAL_ROUTE_PATTERN = '/portal/:departmentSlug'

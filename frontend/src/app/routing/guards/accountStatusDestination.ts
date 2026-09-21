import { routePaths } from '@/app/routing/routePaths'
import { AccountStatus } from '@/shared/api/contracts/identity/accountLifecycle'

/**
 * The screen an account must see before it may reach a portal, or null when it may pass.
 *
 * 账号在进入门户前必须停留的页面；可以放行时返回 null。
 */
export function accountStatusDestination(status: AccountStatus): string | null {
  switch (status) {
    case AccountStatus.PENDING_VERIFICATION:
      return routePaths.verifyEmail
    case AccountStatus.PENDING_APPROVAL:
      return routePaths.awaitingApproval
    case AccountStatus.SUSPENDED:
    case AccountStatus.REJECTED:
      return routePaths.accountRestricted
    case AccountStatus.ACTIVE:
      return null
    default:
      return null
  }
}

import { useSession } from '@/features/authentication/session/context/useSession'
import type { SessionProfile } from '@/shared/api/contracts/identity/sessionProfile'

/**
 * The profile of the member behind a guarded route.
 *
 * Screens below the authentication guard are only ever mounted with a loaded profile, so they read
 * it without repeating a null check the guard already made.
 *
 * 守卫之后的页面必然已加载完成档案，因此直接读取，无需重复守卫已完成的空值判断。
 */
export function useAuthenticatedMember(): SessionProfile {
  const { profile } = useSession()
  if (profile === null) {
    throw new Error('useAuthenticatedMember requires a route guarded by AuthenticatedRouteGuard.')
  }
  return profile
}

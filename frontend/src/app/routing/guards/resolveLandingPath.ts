import { routePaths } from '@/app/routing/routePaths'
import { readLandingPath } from '@/shared/api/client/credentials/tokenStorage'
import type { SessionProfile } from '@/shared/api/contracts/identity/sessionProfile'

/**
 * Where a signed-in member belongs.
 *
 * The server decides this, first through the portal configuration on the profile and otherwise
 * through the `landing_path` recorded at sign-in; the interface only falls back to sign-in when
 * neither is available.
 *
 * 落地位置由服务端决定：优先取档案中的门户配置，其次取登录时记录的 landing_path；
 * 两者都缺失时才回退到登录页。
 */
export function resolveLandingPath(profile: SessionProfile | null): string {
  const portalPath = profile?.primary_portal?.portal_path
  if (portalPath !== undefined && portalPath !== null && portalPath !== '') {
    return portalPath
  }

  const primaryMembership =
    profile?.memberships.find((membership) => membership.is_primary) ?? profile?.memberships[0]
  if (primaryMembership !== undefined) {
    return routePaths.portalRoot(primaryMembership.department_slug)
  }

  return readLandingPath() ?? routePaths.login
}

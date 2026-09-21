import { Navigate, Outlet, useParams } from 'react-router'
import { canEnterDepartmentPortal } from '@/app/routing/guards/canEnterDepartmentPortal'
import { resolveLandingPath } from '@/app/routing/guards/resolveLandingPath'
import { routePaths } from '@/app/routing/routePaths'
import { useAuthenticatedMember } from '@/features/authentication/session/context/useAuthenticatedMember'
import { useSession } from '@/features/authentication/session/context/useSession'

/**
 * Keeps a member inside the portal their department owns, unless they hold organization oversight.
 *
 * 将成员限制在所属部门门户内；持有全社监管权限者除外。
 */
export function PortalMembershipGuard() {
  const profile = useAuthenticatedMember()
  const { actingIdentity } = useSession()
  const { departmentSlug } = useParams()

  if (departmentSlug === undefined || departmentSlug === '') {
    return <Navigate to={resolveLandingPath(profile)} replace />
  }

  if (!canEnterDepartmentPortal(profile, departmentSlug, actingIdentity)) {
    if (actingIdentity !== null && profile.is_platform_administrator === true) {
      return <Navigate to={routePaths.portalRoot(actingIdentity.departmentSlug)} replace />
    }
    return <Navigate to={resolveLandingPath(profile)} replace />
  }

  return <Outlet />
}

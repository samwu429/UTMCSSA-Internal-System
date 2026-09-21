import { Navigate, Outlet } from 'react-router'
import { accountStatusDestination } from '@/app/routing/guards/accountStatusDestination'
import { resolveLandingPath } from '@/app/routing/guards/resolveLandingPath'
import { RouteLoadingScreen } from '@/app/routing/guards/RouteLoadingScreen'
import { useSession } from '@/features/authentication/session/context/useSession'

/**
 * Keeps a signed-in member out of the sign-in and sign-up screens, sending them either to their
 * portal or to the screen their account status requires.
 *
 * 阻止已登录成员再次进入登录与注册页，将其送往所属门户或账号状态对应的说明页。
 */
export function PublicOnlyRouteGuard() {
  const { profile, isLoadingProfile, hasStoredSession, loadError } = useSession()

  if (!hasStoredSession || loadError != null) {
    return <Outlet />
  }

  if (isLoadingProfile) {
    return <RouteLoadingScreen />
  }

  if (profile === null) {
    return <Outlet />
  }

  const requiredDestination = accountStatusDestination(profile.status)
  return <Navigate to={requiredDestination ?? resolveLandingPath(profile)} replace />
}

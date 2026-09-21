import { Navigate, Outlet, useLocation } from 'react-router'
import { accountStatusDestination } from '@/app/routing/guards/accountStatusDestination'
import { RouteLoadingScreen } from '@/app/routing/guards/RouteLoadingScreen'
import { routePaths } from '@/app/routing/routePaths'
import { useSession } from '@/features/authentication/session/context/useSession'

/**
 * Admits only accounts that finished the join flow.
 *
 * Every other state has a screen that explains what is still missing, so the member is redirected
 * there instead of seeing an empty portal.
 *
 * 仅放行已完成加入流程的账号。其余状态各有对应的说明页，
 * 成员被引导至该页而非进入一个空门户。
 */
export function AuthenticatedRouteGuard() {
  const { profile, isLoadingProfile, hasStoredSession, loadError } = useSession()
  const location = useLocation()

  if (!hasStoredSession) {
    return <Navigate to={routePaths.login} replace state={{ intendedPath: location.pathname }} />
  }

  if (isLoadingProfile) {
    return <RouteLoadingScreen label="正在载入账号信息…" />
  }

  if (loadError != null || profile === null) {
    return <Navigate to={routePaths.login} replace />
  }

  const requiredDestination = accountStatusDestination(profile.status)
  if (requiredDestination !== null) {
    return <Navigate to={requiredDestination} replace />
  }

  return <Outlet />
}

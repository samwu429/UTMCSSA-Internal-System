import { Navigate } from 'react-router'
import { accountStatusDestination } from '@/app/routing/guards/accountStatusDestination'
import { resolveLandingPath } from '@/app/routing/guards/resolveLandingPath'
import { RouteLoadingScreen } from '@/app/routing/guards/RouteLoadingScreen'
import { routePaths } from '@/app/routing/routePaths'
import { useSession } from '@/features/authentication/session/context/useSession'

/**
 * The bare `/` address never renders its own screen: it either opens a portal or asks the visitor
 * to sign in.
 *
 * 根路径本身不渲染页面：已登录则进入门户，否则要求登录。
 */
export function RootRedirect() {
  const { profile, isLoadingProfile, hasStoredSession } = useSession()

  if (!hasStoredSession) {
    return <Navigate to={routePaths.login} replace />
  }

  if (isLoadingProfile) {
    return <RouteLoadingScreen label="正在确认部门归属…" />
  }

  if (profile === null) {
    return <Navigate to={routePaths.login} replace />
  }

  return <Navigate to={accountStatusDestination(profile.status) ?? resolveLandingPath(profile)} replace />
}

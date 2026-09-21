import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { sessionQueryKeys } from '@/features/authentication/session/api/sessionQueryKeys'
import { SessionContext } from '@/features/authentication/session/context/sessionContext'
import type { SessionContextValue } from '@/features/authentication/session/context/sessionContextValue'
import { subscribeToSessionExpiry } from '@/shared/api/client/credentials/sessionExpiryNotifier'
import {
  clearStoredTokens,
  hasStoredCredentials,
  readRefreshToken,
  storeTokenPair,
} from '@/shared/api/client/credentials/tokenStorage'
import type { LoginRequest, TokenPair } from '@/shared/api/contracts/identity/authentication'
import {
  readActingIdentity,
  writeActingIdentity,
  type ActingIdentity,
} from '@/features/portals/identity/actingIdentity'
import { signIn as requestSignIn, signOut as requestSignOut } from '@/shared/api/endpoints/identity/authenticationEndpoints'
import { fetchSessionProfile } from '@/shared/api/endpoints/identity/sessionEndpoints'
import { routePaths } from '@/app/routing/routePaths'
import {
  findIdentityLens,
  isHiddenPlatformAdministrator,
  resolveAdministratorIdentityLenses,
} from '@/shared/organization/identityCatalog'

const PROFILE_STALE_TIME_MILLISECONDS = 60_000

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [hasStoredSession, setHasStoredSession] = useState(() => hasStoredCredentials())
  const [actingIdentity, setActingIdentityState] = useState<ActingIdentity | null>(() =>
    readActingIdentity(),
  )

  const profileQuery = useQuery({
    queryKey: sessionQueryKeys.profile(),
    queryFn: ({ signal }) => fetchSessionProfile(signal),
    enabled: hasStoredSession,
    staleTime: PROFILE_STALE_TIME_MILLISECONDS,
    retry: false,
  })

  // The transport layer clears credentials when a refresh fails; the provider mirrors that into
  // React state and sends the member to sign-in with the cache emptied.
  // 刷新失败时传输层会清除凭据；此处将该事件同步到 React 状态，清空缓存并引导至登录页。
  useEffect(
    () =>
      subscribeToSessionExpiry(() => {
        writeActingIdentity(null)
        setActingIdentityState(null)
        setHasStoredSession(false)
        queryClient.clear()
        void navigate(routePaths.login, { replace: true })
      }),
    [queryClient, navigate],
  )

  const signIn = useCallback(
    async (credentials: LoginRequest): Promise<TokenPair> => {
      const tokens = await requestSignIn(credentials)
      storeTokenPair(tokens)
      setHasStoredSession(true)
      await queryClient.invalidateQueries({ queryKey: sessionQueryKeys.root })
      return tokens
    },
    [queryClient],
  )

  const signOut = useCallback(async () => {
    const refreshToken = readRefreshToken()
    try {
      await requestSignOut({ refresh_token: refreshToken, all_sessions: false })
    } catch {
      // A rejected sign-out must not strand the member in a signed-in interface; local credentials
      // are dropped regardless so the browser stops presenting them.
      // 登出请求失败不应让成员停留在已登录界面；无论结果如何都清除本地凭据，停止继续携带。
    }
    clearStoredTokens()
    writeActingIdentity(null)
    setActingIdentityState(null)
    setHasStoredSession(false)
    queryClient.clear()
  }, [queryClient])

  const setActingIdentity = useCallback((identity: ActingIdentity | null) => {
    writeActingIdentity(identity)
    setActingIdentityState(identity)
  }, [])

  const reloadProfile = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: sessionQueryKeys.profile() })
  }, [queryClient])

  const actingLens = useMemo(() => {
    const profile = profileQuery.data
    if (profile == null || !isHiddenPlatformAdministrator(profile) || actingIdentity === null) {
      return null
    }
    return findIdentityLens(
      resolveAdministratorIdentityLenses(profile),
      actingIdentity.departmentSlug,
      actingIdentity.officeKey,
    )
  }, [actingIdentity, profileQuery.data])

  const permissions = useMemo<readonly string[]>(
    () => actingLens?.permissions ?? profileQuery.data?.permissions ?? [],
    [actingLens, profileQuery.data],
  )

  const value = useMemo<SessionContextValue>(
    () => ({
      profile: profileQuery.data ?? null,
      isLoadingProfile: hasStoredSession && profileQuery.isPending,
      loadError: profileQuery.error,
      hasStoredSession,
      permissions,
      isPermitted: (permission: string) => permissions.includes(permission),
      actingIdentity,
      actingLens,
      setActingIdentity,
      signIn,
      signOut,
      reloadProfile,
    }),
    [
      profileQuery.data,
      profileQuery.isPending,
      profileQuery.error,
      hasStoredSession,
      permissions,
      actingIdentity,
      actingLens,
      setActingIdentity,
      signIn,
      signOut,
      reloadProfile,
    ],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

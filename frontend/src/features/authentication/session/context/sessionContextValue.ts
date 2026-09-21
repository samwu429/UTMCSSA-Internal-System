import type { ActingIdentity } from '@/features/portals/identity/actingIdentity'
import type { IdentityLens } from '@/shared/api/contracts/identity/sessionProfile'
import type { LoginRequest, TokenPair } from '@/shared/api/contracts/identity/authentication'
import type { SessionProfile } from '@/shared/api/contracts/identity/sessionProfile'

export interface SessionContextValue {
  /** Null until the profile has loaded, and after sign-out. */
  profile: SessionProfile | null
  isLoadingProfile: boolean
  loadError: unknown
  /** True when tokens exist locally, which is what distinguishes "loading" from "signed out". */
  hasStoredSession: boolean
  permissions: readonly string[]
  isPermitted: (permission: string) => boolean
  actingIdentity: ActingIdentity | null
  actingLens: IdentityLens | null
  setActingIdentity: (identity: ActingIdentity | null) => void
  signIn: (credentials: LoginRequest) => Promise<TokenPair>
  signOut: () => Promise<void>
  reloadProfile: () => void
}

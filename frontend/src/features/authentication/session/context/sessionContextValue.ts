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
  signIn: (credentials: LoginRequest) => Promise<TokenPair>
  signOut: () => Promise<void>
  reloadProfile: () => void
}

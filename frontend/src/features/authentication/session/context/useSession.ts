import { useContext } from 'react'
import { SessionContext } from '@/features/authentication/session/context/sessionContext'
import type { SessionContextValue } from '@/features/authentication/session/context/sessionContextValue'

export function useSession(): SessionContextValue {
  const session = useContext(SessionContext)
  if (session === null) {
    throw new Error('useSession must be used inside SessionProvider.')
  }
  return session
}

import { createContext } from 'react'
import type { SessionContextValue } from '@/features/authentication/session/context/sessionContextValue'

export const SessionContext = createContext<SessionContextValue | null>(null)

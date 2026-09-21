import type { ReactNode } from 'react'
import { ToastProvider } from '@/app/providers/notifications/ToastProvider'
import { ServerStateProvider } from '@/app/providers/serverState/ServerStateProvider'
import { SessionProvider } from '@/features/authentication/session/context/SessionProvider'

export function ApplicationProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ServerStateProvider>
        <SessionProvider>{children}</SessionProvider>
      </ServerStateProvider>
    </ToastProvider>
  )
}

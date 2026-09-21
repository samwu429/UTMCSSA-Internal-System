import { QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { useToastController } from '@/app/providers/notifications/useToastController'
import { createQueryClient } from '@/app/providers/serverState/createQueryClient'

export function ServerStateProvider({ children }: { children: ReactNode }) {
  const toasts = useToastController()
  const [queryClient] = useState(() => createQueryClient(toasts))

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

import type { ReactNode } from 'react'

export function PortalThemeProvider({ children }: { accentColor: string; children: ReactNode }) {
  return <>{children}</>
}

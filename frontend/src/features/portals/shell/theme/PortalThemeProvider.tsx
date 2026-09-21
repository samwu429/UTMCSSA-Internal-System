import { useEffect, type ReactNode } from 'react'
import { deriveAccentPalette } from '@/features/portals/shell/theme/deriveAccentPalette'

export function PortalThemeProvider({
  accentColor,
  children,
}: {
  accentColor: string
  children: ReactNode
}) {
  useEffect(() => {
    const palette = deriveAccentPalette(accentColor)
    const root = document.documentElement
    root.style.setProperty('--portal-accent', palette.accent)
    root.style.setProperty('--portal-accent-strong', palette.strong)
    root.style.setProperty('--portal-accent-soft', palette.soft)
    root.style.setProperty('--portal-accent-border', palette.border)
    root.style.setProperty('--portal-accent-contrast', palette.contrast)

    return () => {
      root.style.removeProperty('--portal-accent')
      root.style.removeProperty('--portal-accent-strong')
      root.style.removeProperty('--portal-accent-soft')
      root.style.removeProperty('--portal-accent-border')
      root.style.removeProperty('--portal-accent-contrast')
    }
  }, [accentColor])

  return <>{children}</>
}

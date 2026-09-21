import { createContext } from 'react'
import type { PortalWorkspace } from '@/features/portals/shell/context/portalWorkspaceValue'

export const PortalWorkspaceContext = createContext<PortalWorkspace | null>(null)

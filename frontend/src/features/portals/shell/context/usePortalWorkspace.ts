import { useContext } from 'react'
import { PortalWorkspaceContext } from '@/features/portals/shell/context/portalWorkspaceContext'

export function usePortalWorkspace() {
  const workspace = useContext(PortalWorkspaceContext)
  if (workspace === null) {
    throw new Error('usePortalWorkspace requires a route rendered inside PortalShell.')
  }
  return workspace
}

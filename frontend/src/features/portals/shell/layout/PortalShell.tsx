import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Outlet, useParams } from 'react-router'
import { useAuthenticatedMember } from '@/features/authentication/session/context/useAuthenticatedMember'
import { portalQueryKeys } from '@/features/portals/shell/api/portalQueryKeys'
import { PortalWorkspaceContext } from '@/features/portals/shell/context/portalWorkspaceContext'
import type { PortalWorkspace } from '@/features/portals/shell/context/portalWorkspaceValue'
import { PortalSidebar } from '@/features/portals/shell/layout/PortalSidebar'
import { PortalTopBar } from '@/features/portals/shell/layout/PortalTopBar'
import { PortalThemeProvider } from '@/features/portals/shell/theme/PortalThemeProvider'
import type { MembershipSummary, PortalConfiguration } from '@/shared/api/contracts/identity/sessionProfile'
import type { DepartmentWithHeadcount } from '@/shared/api/contracts/organization/department'
import { fetchDepartments, fetchPortalConfiguration } from '@/shared/api/endpoints/organization/departmentEndpoints'
import { QueryStateBoundary } from '@/shared/ui/feedback/QueryStateBoundary'

export function PortalShell() {
  const { departmentSlug = '' } = useParams()
  const profile = useAuthenticatedMember()

  const portalQuery = useQuery({
    queryKey: portalQueryKeys.configuration(departmentSlug),
    queryFn: ({ signal }) => fetchPortalConfiguration(departmentSlug, signal),
    enabled: departmentSlug !== '',
  })

  const departmentsQuery = useQuery({
    queryKey: portalQueryKeys.departments(),
    queryFn: ({ signal }) => fetchDepartments(signal),
  })

  return (
    <QueryStateBoundary
      isPending={portalQuery.isPending}
      error={portalQuery.error}
      data={portalQuery.data}
      onRetry={() => {
        void portalQuery.refetch()
      }}
      loadingLabel="正在载入部门系统…"
    >
      {(portal) => (
        <PortalWorkspaceInner
          portal={portal}
          departments={departmentsQuery.data ?? []}
          profileMemberships={profile.memberships}
        />
      )}
    </QueryStateBoundary>
  )
}

function PortalWorkspaceInner({
  portal,
  departments,
  profileMemberships,
}: {
  portal: PortalConfiguration
  departments: DepartmentWithHeadcount[]
  profileMemberships: MembershipSummary[]
}) {
  const membership =
    profileMemberships.find((item) => item.department_slug === portal.slug) ?? null
  const workspace = useMemo<PortalWorkspace>(
    () => ({
      departmentSlug: portal.slug,
      portal,
      department: departments.find((item) => item.slug === portal.slug) ?? null,
      membership,
      isVisitingForOversight: membership === null,
    }),
    [departments, membership, portal],
  )

  return (
    <PortalWorkspaceContext.Provider value={workspace}>
      <PortalThemeProvider accentColor={portal.accent_color}>
        <div className="flex min-h-screen bg-neutral-100">
          <PortalSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <PortalTopBar />
            <main className="flex-1 px-6 py-6">
              <Outlet />
            </main>
          </div>
        </div>
      </PortalThemeProvider>
    </PortalWorkspaceContext.Provider>
  )
}

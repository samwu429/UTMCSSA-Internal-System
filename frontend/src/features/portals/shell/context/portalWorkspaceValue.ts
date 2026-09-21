import type { PortalConfiguration } from '@/shared/api/contracts/identity/sessionProfile'
import type { DepartmentWithHeadcount } from '@/shared/api/contracts/organization/department'
import type { MembershipSummary } from '@/shared/api/contracts/identity/sessionProfile'

export interface PortalWorkspace {
  departmentSlug: string
  portal: PortalConfiguration
  department: DepartmentWithHeadcount | null
  membership: MembershipSummary | null
  isVisitingForOversight: boolean
}

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useToastController } from '@/app/providers/notifications/useToastController'
import { administrationQueryKeys } from '@/features/administration/console/api/administrationQueryKeys'
import { ApprovalCard } from '@/features/administration/console/tabs/approvals/ApprovalCard'
import { portalQueryKeys } from '@/features/portals/shell/api/portalQueryKeys'
import { fetchPendingRegistrations } from '@/shared/api/endpoints/organization/administrationEndpoints'
import { fetchDepartments } from '@/shared/api/endpoints/organization/departmentEndpoints'
import { fetchRoles } from '@/shared/api/endpoints/organization/roleEndpoints'
import { EmptyState } from '@/shared/ui/feedback/EmptyState'
import { QueryStateBoundary } from '@/shared/ui/feedback/QueryStateBoundary'
import { Panel } from '@/shared/ui/primitives/surface/Panel'

export function ApprovalsPane() {
  const toasts = useToastController()
  const queryClient = useQueryClient()
  const pendingQuery = useQuery({
    queryKey: administrationQueryKeys.pending(),
    queryFn: ({ signal }) => fetchPendingRegistrations(signal),
  })
  const departmentsQuery = useQuery({
    queryKey: portalQueryKeys.departments(),
    queryFn: ({ signal }) => fetchDepartments(signal),
  })
  const rolesQuery = useQuery({
    queryKey: administrationQueryKeys.roles(),
    queryFn: ({ signal }) => fetchRoles(undefined, signal),
  })

  return (
    <QueryStateBoundary
      isPending={pendingQuery.isPending}
      error={pendingQuery.error}
      data={pendingQuery.data}
      onRetry={() => {
        void pendingQuery.refetch()
      }}
    >
      {(pending) =>
        pending.length === 0 ? (
          <Panel>
            <EmptyState title="没有待审批的注册" description="新成员验证学校邮箱后会出现在这里。" />
          </Panel>
        ) : (
          <div className="space-y-4">
            {pending.map((application) => (
              <ApprovalCard
                key={application.user_id}
                application={application}
                departments={departmentsQuery.data ?? []}
                roles={rolesQuery.data ?? []}
                onApproved={async () => {
                  toasts.showSuccess('已通过，成员会收到邮件并进入所属部门页面。')
                  await queryClient.invalidateQueries({ queryKey: administrationQueryKeys.root })
                }}
                onRejected={async () => {
                  toasts.showSuccess('已拒绝该申请。')
                  await queryClient.invalidateQueries({ queryKey: administrationQueryKeys.root })
                }}
                onFailure={(error) => {
                  toasts.showRequestFailure(error)
                }}
              />
            ))}
          </div>
        )
      }
    </QueryStateBoundary>
  )
}

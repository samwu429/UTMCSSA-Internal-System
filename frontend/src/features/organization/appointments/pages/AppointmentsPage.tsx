import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useToastController } from '@/app/providers/notifications/useToastController'
import { administrationQueryKeys } from '@/features/administration/console/api/administrationQueryKeys'
import { ApprovalCard } from '@/features/administration/console/tabs/approvals/ApprovalCard'
import { memberQueryKeys } from '@/features/directory/members/api/memberQueryKeys'
import { useSession } from '@/features/authentication/session/context/useSession'
import { usePortalWorkspace } from '@/features/portals/shell/context/usePortalWorkspace'
import { portalQueryKeys } from '@/features/portals/shell/api/portalQueryKeys'
import { Permission } from '@/shared/api/contracts/authorization/permissionIdentifiers'
import type { OfficeSeatView } from '@/shared/api/contracts/organization/appointment'
import {
  appointOffice,
  fetchOfficeBoard,
  fetchPendingRegistrations,
  releaseOffice,
} from '@/shared/api/endpoints/organization/administrationEndpoints'
import { fetchMemberPage } from '@/shared/api/endpoints/directory/memberEndpoints'
import { fetchDepartments } from '@/shared/api/endpoints/organization/departmentEndpoints'
import { fetchRoles } from '@/shared/api/endpoints/organization/roleEndpoints'
import {
  filterOfficeBoardForPreview,
  filterPendingForPreview,
} from '@/shared/organization/appointmentRules'
import { PRESIDIUM_PRESIDENT_ROLE_KEY } from '@/shared/organization/offices'
import { isHiddenPlatformAdministrator } from '@/shared/organization/identityCatalog'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { EmptyState } from '@/shared/ui/feedback/EmptyState'
import { QueryStateBoundary } from '@/shared/ui/feedback/QueryStateBoundary'
import { Button } from '@/shared/ui/primitives/button/Button'
import { TextField } from '@/shared/ui/primitives/field/TextField'
import { PageHeading } from '@/shared/ui/primitives/surface/PageHeading'
import { Panel } from '@/shared/ui/primitives/surface/Panel'
import { useAuthenticatedMember } from '@/features/authentication/session/context/useAuthenticatedMember'

export function AppointmentsPage() {
  const profile = useAuthenticatedMember()
  const { actingLens, isPermitted } = useSession()
  const { portal } = usePortalWorkspace()
  const toasts = useToastController()
  const queryClient = useQueryClient()
  const admissionOnly = !(isHiddenPlatformAdministrator(profile) && actingLens === null)
  const canReview = isPermitted(Permission.ADMIN_REVIEW_REGISTRATIONS)
  const canAppoint = isPermitted(Permission.ADMIN_ASSIGN_DEPARTMENTS)

  const pendingQuery = useQuery({
    queryKey: administrationQueryKeys.pending(),
    queryFn: ({ signal }) => fetchPendingRegistrations(signal),
    enabled: canReview,
  })
  const boardQuery = useQuery({
    queryKey: administrationQueryKeys.offices(),
    queryFn: ({ signal }) => fetchOfficeBoard(signal),
    enabled: canAppoint,
  })
  const departmentsQuery = useQuery({
    queryKey: portalQueryKeys.departments(),
    queryFn: ({ signal }) => fetchDepartments(signal),
    enabled: canReview,
  })
  const rolesQuery = useQuery({
    queryKey: administrationQueryKeys.roles(),
    queryFn: ({ signal }) => fetchRoles(undefined, signal),
    enabled: canReview,
  })

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: administrationQueryKeys.root })
    await queryClient.invalidateQueries({ queryKey: memberQueryKeys.root })
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="任职与审批"
        englishTitle="Offices"
        description={
          actingLens?.office_key === PRESIDIUM_PRESIDENT_ROLE_KEY || portal.slug === 'presidium'
            ? '主席任命各部门部长、下一任主席和主席团成员。申请加入主席团的人在此审批为成员。'
            : '部长可任命两名副部长。部长和副部长审批申请进入本部门担任部员的新成员。'
        }
      />

      {canReview ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-900">待加入申请</h2>
          <QueryStateBoundary
            isPending={pendingQuery.isPending}
            error={pendingQuery.error}
            data={pendingQuery.data}
            onRetry={() => {
              void pendingQuery.refetch()
            }}
          >
            {(pending) => {
              const visible = filterPendingForPreview(pending, actingLens)
              return visible.length === 0 ? (
                <Panel>
                  <EmptyState
                    title="没有待审批的申请"
                    description="新成员验证学校邮箱并选择本部门后会出现在这里。"
                  />
                </Panel>
              ) : (
                <div className="space-y-4">
                  {visible.map((application) => (
                    <ApprovalCard
                      key={application.user_id}
                      application={application}
                      departments={departmentsQuery.data ?? []}
                      roles={rolesQuery.data ?? []}
                      admissionOnly={admissionOnly}
                      onApproved={async () => {
                        toasts.showSuccess('已同意该成员进入部门担任部员。')
                        await refresh()
                      }}
                      onRejected={async () => {
                        toasts.showSuccess('已拒绝该申请。')
                        await refresh()
                      }}
                      onFailure={(error) => {
                        toasts.showRequestFailure(error)
                      }}
                    />
                  ))}
                </div>
              )
            }}
          </QueryStateBoundary>
        </section>
      ) : null}

      {canAppoint ? (
        <QueryStateBoundary
          isPending={boardQuery.isPending}
          error={boardQuery.error}
          data={boardQuery.data}
          onRetry={() => {
            void boardQuery.refetch()
          }}
        >
          {(board) => {
            const visible = filterOfficeBoardForPreview(board, actingLens)
            return visible.departments.length === 0 ? (
              <Panel>
                <EmptyState title="当前职务不能任命其他人" />
              </Panel>
            ) : (
              <div className="space-y-4">
                {visible.departments.map((department) => (
                  <Panel
                    key={department.department_id}
                    title={department.department_name_zh}
                    description={department.department_name_en}
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      {department.offices.map((office) => (
                        <OfficeSeatCard
                          key={office.office_key}
                          departmentId={department.department_id}
                          departmentName={department.department_name_zh}
                          office={office}
                          onChanged={refresh}
                        />
                      ))}
                    </div>
                  </Panel>
                ))}
              </div>
            )
          }}
        </QueryStateBoundary>
      ) : null}
    </div>
  )
}

function officeHeading(office: OfficeSeatView): string {
  if (office.office_key === PRESIDIUM_PRESIDENT_ROLE_KEY) {
    return '主席 / 下一任主席'
  }
  return office.office_name_zh
}

function OfficeSeatCard({
  departmentId,
  departmentName,
  office,
  onChanged,
}: {
  departmentId: string
  departmentName: string
  office: OfficeSeatView
  onChanged: () => Promise<void>
}) {
  const toasts = useToastController()
  const [isPicking, setIsPicking] = useState(false)
  const filled = office.holders.length
  const remaining = Math.max(office.seat_limit - filled, 0)

  return (
    <div className="rounded-lg border border-neutral-200 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-neutral-900">{officeHeading(office)}</p>
          <p className="text-xs text-neutral-500">
            {filled}/{office.seat_limit || '—'} 人在任
            {remaining > 0 ? ` · 还可任命 ${remaining} 人` : ''}
          </p>
        </div>
        {office.can_appoint && (remaining > 0 || office.seat_limit === 1) ? (
          <Button size="small" variant="primary" onClick={() => setIsPicking((open) => !open)}>
            {isPicking ? '收起' : remaining === 0 ? '任命下一任' : '任命'}
          </Button>
        ) : null}
      </div>
      <ul className="mt-3 space-y-2">
        {office.holders.length === 0 ? (
          <li className="text-xs text-neutral-500">目前空缺</li>
        ) : (
          office.holders.map((holder) => (
            <li key={holder.membership_id} className="flex items-center justify-between gap-2">
              <span className="text-sm text-neutral-800">{holder.display_name}</span>
              {office.can_release ? (
                <Button
                  size="small"
                  variant="danger"
                  onClick={() => {
                    void releaseOffice(holder.membership_id)
                      .then(async () => {
                        toasts.showSuccess(`已卸任${departmentName}${office.office_name_zh}。`)
                        await onChanged()
                      })
                      .catch((error: unknown) => {
                        toasts.showRequestFailure(error)
                      })
                  }}
                >
                  卸任
                </Button>
              ) : null}
            </li>
          ))
        )}
      </ul>
      {isPicking ? (
        <MemberPicker
          departmentId={departmentId}
          officeKey={office.office_key}
          officeName={officeHeading(office)}
          onAppointed={async () => {
            setIsPicking(false)
            await onChanged()
          }}
        />
      ) : null}
    </div>
  )
}

function MemberPicker({
  departmentId,
  officeKey,
  officeName,
  onAppointed,
}: {
  departmentId: string
  officeKey: string
  officeName: string
  onAppointed: () => Promise<void>
}) {
  const toasts = useToastController()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const membersQuery = useQuery({
    queryKey: memberQueryKeys.page({ search: debouncedSearch || undefined, page: 1, page_size: 8 }),
    queryFn: ({ signal }) =>
      fetchMemberPage({ search: debouncedSearch || undefined, page: 1, page_size: 8 }, signal),
  })
  const mutation = useMutation({
    mutationFn: (userId: string) =>
      appointOffice({
        user_id: userId,
        department_id: departmentId,
        office_key: officeKey,
      }),
    onSuccess: async () => {
      toasts.showSuccess(`已任命为${officeName}。`)
      await onAppointed()
    },
    onError: (error: unknown) => {
      toasts.showRequestFailure(error)
    },
  })

  return (
    <div className="mt-3 border-t border-neutral-100 pt-3">
      <TextField
        label="从在册成员中选择"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <ul className="mt-2 divide-y divide-neutral-100">
        {(membersQuery.data?.items ?? []).map((member) => (
          <li key={member.user_id} className="flex items-center justify-between gap-2 py-2">
            <div>
              <p className="text-sm text-neutral-900">{member.display_name}</p>
              <p className="text-xs text-neutral-500">
                {member.departments.map((item) => `${item.name_zh}${item.role_name_zh}`).join('、') ||
                  '尚未任职'}
              </p>
            </div>
            <Button
              size="small"
              variant="primary"
              isBusy={mutation.isPending}
              onClick={() => {
                mutation.mutate(member.user_id)
              }}
            >
              任命
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}

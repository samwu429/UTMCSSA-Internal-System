import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useToastController } from '@/app/providers/notifications/useToastController'
import { administrationQueryKeys } from '@/features/administration/console/api/administrationQueryKeys'
import { memberQueryKeys } from '@/features/directory/members/api/memberQueryKeys'
import { portalQueryKeys } from '@/features/portals/shell/api/portalQueryKeys'
import type { MemberSummary } from '@/shared/api/contracts/directory/member'
import { fetchMemberPage } from '@/shared/api/endpoints/directory/memberEndpoints'
import {
  assignMembership,
  removeMembership,
  updateMembership,
} from '@/shared/api/endpoints/organization/membershipEndpoints'
import { fetchDepartments } from '@/shared/api/endpoints/organization/departmentEndpoints'
import { fetchRoles } from '@/shared/api/endpoints/organization/roleEndpoints'
import type { RoleSummary } from '@/shared/api/contracts/organization/role'
import {
  defaultRoleIdForDepartment,
  rolesAssignableInDepartment,
} from '@/shared/organization/offices'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { ColourDotBadge } from '@/shared/ui/primitives/badge/ColourDotBadge'
import { EmptyState } from '@/shared/ui/feedback/EmptyState'
import { QueryStateBoundary } from '@/shared/ui/feedback/QueryStateBoundary'
import { Button } from '@/shared/ui/primitives/button/Button'
import { CheckboxField } from '@/shared/ui/primitives/field/CheckboxField'
import { SelectField } from '@/shared/ui/primitives/field/SelectField'
import { TextField } from '@/shared/ui/primitives/field/TextField'
import { PaginationControls } from '@/shared/ui/primitives/pagination/PaginationControls'
import { Panel } from '@/shared/ui/primitives/surface/Panel'

export function MembershipPlacementPane() {
  const toasts = useToastController()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [departmentId, setDepartmentId] = useState('')
  const [roleId, setRoleId] = useState('')
  const [titleZh, setTitleZh] = useState('')
  const [isPrimary, setIsPrimary] = useState(true)
  const debouncedSearch = useDebouncedValue(search, 300)

  const membersQuery = useQuery({
    queryKey: memberQueryKeys.page({ search: debouncedSearch || undefined, page, page_size: 12 }),
    queryFn: ({ signal }) =>
      fetchMemberPage({ search: debouncedSearch || undefined, page, page_size: 12 }, signal),
  })
  const departmentsQuery = useQuery({
    queryKey: portalQueryKeys.departments(),
    queryFn: ({ signal }) => fetchDepartments(signal),
  })
  const rolesQuery = useQuery({
    queryKey: administrationQueryKeys.roles(),
    queryFn: ({ signal }) => fetchRoles(undefined, signal),
  })

  const selectedMember = membersQuery.data?.items.find((item) => item.user_id === selectedUserId)
  const selectedDepartmentSlug =
    (departmentsQuery.data ?? []).find((item) => item.id === departmentId)?.slug ?? ''
  const assignableRoles = rolesAssignableInDepartment(rolesQuery.data ?? [], selectedDepartmentSlug)

  const refreshMembers = async () => {
    await queryClient.invalidateQueries({ queryKey: memberQueryKeys.root })
  }

  const assignMutation = useMutation({
    mutationFn: () => {
      if (selectedUserId === null) {
        throw new Error('Select a member first.')
      }
      return assignMembership({
        user_id: selectedUserId,
        department_id: departmentId,
        role_id: roleId,
        is_primary: isPrimary,
        title_zh: titleZh || null,
      })
    },
    onSuccess: async () => {
      toasts.showSuccess('部门归属已更新。下次登录会进入新的主部门页面。')
      setTitleZh('')
      await refreshMembers()
    },
  })

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <Panel title="成员与部门归属" description="把人放进部门，或调整其主归属。主归属决定登录后进入哪一套部门页面。">
        <TextField
          label="搜索成员"
          value={search}
          containerClassName="mb-4"
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
        />
        <QueryStateBoundary
          isPending={membersQuery.isPending}
          error={membersQuery.error}
          data={membersQuery.data}
          onRetry={() => {
            void membersQuery.refetch()
          }}
        >
          {(pageData) => (
            <>
              {pageData.items.length === 0 ? (
                <EmptyState title="没有找到成员" />
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {pageData.items.map((member) => (
                    <MemberPlacementRow
                      key={member.user_id}
                      member={member}
                      isSelected={member.user_id === selectedUserId}
                      roles={rolesQuery.data ?? []}
                      onSelect={() => {
                        setSelectedUserId(member.user_id)
                      }}
                      onMarkPrimary={(membershipId) => {
                        void updateMembership(membershipId, { is_primary: true })
                          .then(async () => {
                            toasts.showSuccess('已设为主归属部门。')
                            await refreshMembers()
                          })
                          .catch((error: unknown) => {
                            toasts.showRequestFailure(error)
                          })
                      }}
                      onChangeRole={(membershipId, nextRoleId) => {
                        void updateMembership(membershipId, { role_id: nextRoleId })
                          .then(async () => {
                            toasts.showSuccess('权限集合已调整。')
                            await refreshMembers()
                          })
                          .catch((error: unknown) => {
                            toasts.showRequestFailure(error)
                          })
                      }}
                      onRemove={(membershipId) => {
                        void removeMembership(membershipId)
                          .then(async () => {
                            toasts.showSuccess('已从该部门移出。')
                            await refreshMembers()
                          })
                          .catch((error: unknown) => {
                            toasts.showRequestFailure(error)
                          })
                      }}
                    />
                  ))}
                </ul>
              )}
              <PaginationControls
                page={pageData.page}
                pageSize={pageData.page_size}
                total={pageData.total}
                onPageChange={setPage}
              />
            </>
          )}
        </QueryStateBoundary>
      </Panel>

      <Panel
        title="加入另一个部门"
        description={
          selectedMember === undefined
            ? '先在左侧点选一位成员。'
            : `正在安排 ${selectedMember.display_name}`
        }
      >
        <div className="space-y-4">
          <SelectField
            label="部门"
            value={departmentId}
            placeholderLabel="选择部门"
            options={(departmentsQuery.data ?? []).map((item) => ({
              value: item.id,
              label: item.name_zh,
            }))}
            onChange={(event) => {
              const nextDepartmentId = event.target.value
              setDepartmentId(nextDepartmentId)
              const slug =
                (departmentsQuery.data ?? []).find((item) => item.id === nextDepartmentId)?.slug ??
                ''
              const nextRoleId = defaultRoleIdForDepartment(rolesQuery.data ?? [], slug)
              setRoleId(nextRoleId)
              const nextRole = (rolesQuery.data ?? []).find((item) => item.id === nextRoleId)
              setTitleZh(nextRole?.name_zh ?? '')
            }}
          />
          <SelectField
            label="职务"
            value={roleId}
            placeholderLabel="选择职务"
            options={assignableRoles.map((item) => ({
              value: item.id,
              label: item.name_zh,
            }))}
            onChange={(event) => {
              setRoleId(event.target.value)
              const nextRole = assignableRoles.find((item) => item.id === event.target.value)
              setTitleZh(nextRole?.name_zh ?? titleZh)
            }}
          />
          <TextField
            label="职务称呼"
            value={titleZh}
            onChange={(event) => setTitleZh(event.target.value)}
          />
          <CheckboxField
            label="设为登录后进入的主部门"
            checked={isPrimary}
            onChange={(event) => setIsPrimary(event.target.checked)}
          />
          <Button
            variant="primary"
            disabled={selectedUserId === null || departmentId === '' || roleId === ''}
            isBusy={assignMutation.isPending}
            onClick={() => {
              assignMutation.mutate()
            }}
          >
            加入该部门
          </Button>
        </div>
      </Panel>
    </div>
  )
}

function MemberPlacementRow({
  member,
  isSelected,
  roles,
  onSelect,
  onMarkPrimary,
  onChangeRole,
  onRemove,
}: {
  member: MemberSummary
  isSelected: boolean
  roles: readonly RoleSummary[]
  onSelect: () => void
  onMarkPrimary: (membershipId: string) => void
  onChangeRole: (membershipId: string, roleId: string) => void
  onRemove: (membershipId: string) => void
}) {
  return (
    <li className={isSelected ? 'bg-[var(--portal-accent-soft)]' : undefined}>
      <button type="button" className="w-full px-3 py-3 text-left" onClick={onSelect}>
        <p className="text-sm font-medium text-neutral-900">{member.display_name}</p>
        <p className="text-xs text-neutral-500">
          {member.graduation_year ?? '毕业年份未填'}
          {member.program_of_study != null ? ` · ${member.program_of_study}` : ''}
        </p>
      </button>
      <ul className="space-y-2 px-3 pb-3">
        {member.departments.map((badge) => (
          <li
            key={badge.membership_id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2"
          >
            <ColourDotBadge colour={badge.accent_color}>
              {badge.name_zh}
              {badge.is_primary ? ' · 主归属' : ''}
            </ColourDotBadge>
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label={`${badge.name_zh}的权限集合`}
                className="rounded-md border border-neutral-300 px-2 py-1 text-xs"
                value=""
                onChange={(event) => {
                  if (event.target.value !== '') {
                    onChangeRole(badge.membership_id, event.target.value)
                  }
                }}
              >
                <option value="">{badge.role_name_zh}</option>
                {rolesAssignableInDepartment(roles, badge.slug).map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name_zh}
                  </option>
                ))}
              </select>
              {badge.is_primary ? null : (
                <Button size="small" onClick={() => onMarkPrimary(badge.membership_id)}>
                  设为主部门
                </Button>
              )}
              <Button size="small" variant="danger" onClick={() => onRemove(badge.membership_id)}>
                移出
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </li>
  )
}

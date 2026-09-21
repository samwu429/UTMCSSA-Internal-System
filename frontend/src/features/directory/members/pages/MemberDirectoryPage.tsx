import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { memberQueryKeys } from '@/features/directory/members/api/memberQueryKeys'
import { portalQueryKeys } from '@/features/portals/shell/api/portalQueryKeys'
import { usePortalWorkspace } from '@/features/portals/shell/context/usePortalWorkspace'
import { useSession } from '@/features/authentication/session/context/useSession'
import { Permission } from '@/shared/api/contracts/authorization/permissionIdentifiers'
import { AffiliationType } from '@/shared/api/contracts/identity/accountLifecycle'
import type { MemberSummary } from '@/shared/api/contracts/directory/member'
import { downloadMemberRoster, fetchMemberPage } from '@/shared/api/endpoints/directory/memberEndpoints'
import { fetchDepartments } from '@/shared/api/endpoints/organization/departmentEndpoints'
import { triggerBlobDownload } from '@/shared/browser/fileDownload/triggerBrowserDownload'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { affiliationLabels } from '@/shared/localization/enumLabels/identityLabels'
import { useToastController } from '@/app/providers/notifications/useToastController'
import { EmptyState } from '@/shared/ui/feedback/EmptyState'
import { QueryStateBoundary } from '@/shared/ui/feedback/QueryStateBoundary'
import { ColourDotBadge } from '@/shared/ui/primitives/badge/ColourDotBadge'
import { Button } from '@/shared/ui/primitives/button/Button'
import { DataTable } from '@/shared/ui/primitives/dataTable/DataTable'
import type { DataTableColumn } from '@/shared/ui/primitives/dataTable/dataTableTypes'
import { TextField } from '@/shared/ui/primitives/field/TextField'
import { SelectField } from '@/shared/ui/primitives/field/SelectField'
import { PaginationControls } from '@/shared/ui/primitives/pagination/PaginationControls'
import { PageHeading } from '@/shared/ui/primitives/surface/PageHeading'
import { Panel } from '@/shared/ui/primitives/surface/Panel'

export function MemberDirectoryPage() {
  const { portal } = usePortalWorkspace()
  const { isPermitted } = useSession()
  const toasts = useToastController()
  const [search, setSearch] = useState('')
  const [graduationYear, setGraduationYear] = useState('')
  const [affiliation, setAffiliation] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search, 300)
  const canSeeContact = isPermitted(Permission.DIRECTORY_VIEW_CONTACT_DETAILS)

  const scopedDepartmentId = portal.has_organization_oversight
    ? departmentFilter === ''
      ? undefined
      : departmentFilter
    : portal.department_id
  const query = {
    search: debouncedSearch || undefined,
    department_id: scopedDepartmentId,
    graduation_year: graduationYear === '' ? undefined : Number(graduationYear),
    affiliation: affiliation === '' ? undefined : (affiliation as typeof AffiliationType.STUDENT),
    page,
    page_size: 20,
  }

  const membersQuery = useQuery({
    queryKey: memberQueryKeys.page(query),
    queryFn: ({ signal }) => fetchMemberPage(query, signal),
  })
  const departmentsQuery = useQuery({
    queryKey: portalQueryKeys.departments(),
    queryFn: ({ signal }) => fetchDepartments(signal),
    enabled: portal.has_organization_oversight,
  })

  const columns = useMemo<DataTableColumn<MemberSummary>[]>(
    () => [
      {
        key: 'name',
        header: '姓名',
        renderCell: (row) => (
          <div>
            <p className="font-medium text-neutral-900">{row.display_name}</p>
            {row.chinese_name != null ? (
              <p className="text-xs text-neutral-500">{row.chinese_name}</p>
            ) : null}
          </div>
        ),
      },
      {
        key: 'affiliation',
        header: '身份',
        renderCell: (row) => affiliationLabels[row.affiliation],
      },
      {
        key: 'year',
        header: '毕业年份',
        renderCell: (row) => row.graduation_year ?? '—',
      },
      {
        key: 'program',
        header: '专业',
        isSecondary: true,
        renderCell: (row) => row.program_of_study ?? '—',
      },
      {
        key: 'departments',
        header: '部门',
        renderCell: (row) => (
          <div className="flex flex-wrap gap-1">
            {row.departments.map((badge) => (
              <ColourDotBadge key={badge.department_id} colour={badge.accent_color}>
                {badge.name_zh}
              </ColourDotBadge>
            ))}
          </div>
        ),
      },
      ...(canSeeContact
        ? [
            {
              key: 'email',
              header: '邮箱',
              isSecondary: true,
              renderCell: (row: MemberSummary) => row.email ?? '—',
            } satisfies DataTableColumn<MemberSummary>,
          ]
        : []),
    ],
    [canSeeContact],
  )

  return (
    <div className="space-y-6">
      <PageHeading
        title={portal.has_organization_oversight ? '全社成员名录' : `${portal.name_zh}成员名录`}
        englishTitle="Member directory"
        description="按毕业年份、在校或毕业身份查找成员。联系方式仅对有权限的账号显示。"
        actions={
          isPermitted(Permission.DIRECTORY_EXPORT) ? (
            <Button
              onClick={() => {
                void downloadMemberRoster()
                  .then((blob) => {
                    triggerBlobDownload(blob, 'utmcssa-members.csv')
                  })
                  .catch((error: unknown) => {
                    toasts.showRequestFailure(error)
                  })
              }}
            >
              导出名单
            </Button>
          ) : null
        }
      />

      <Panel bodyClassName="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {portal.has_organization_oversight ? (
            <SelectField
              label="部门"
              value={departmentFilter}
              placeholderLabel="全部部门"
              options={(departmentsQuery.data ?? []).map((item) => ({
                value: item.id,
                label: item.name_zh,
              }))}
              onChange={(event) => {
                setDepartmentFilter(event.target.value)
                setPage(1)
              }}
            />
          ) : null}
          <TextField
            label="搜索姓名或专业"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
          <TextField
            label="毕业年份"
            type="number"
            value={graduationYear}
            placeholder="例如 2027"
            onChange={(event) => {
              setGraduationYear(event.target.value)
              setPage(1)
            }}
          />
          <SelectField
            label="身份"
            value={affiliation}
            placeholderLabel="全部"
            options={[
              { value: AffiliationType.STUDENT, label: '在校生' },
              { value: AffiliationType.ALUMNUS, label: '毕业生' },
            ]}
            onChange={(event) => {
              setAffiliation(event.target.value)
              setPage(1)
            }}
          />
        </div>

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
              <DataTable
                caption="成员名录"
                columns={columns}
                rows={pageData.items}
                extractRowKey={(row) => row.user_id}
                emptyState={<EmptyState title="没有符合条件的成员" description="调整筛选条件后再试。" />}
              />
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
    </div>
  )
}

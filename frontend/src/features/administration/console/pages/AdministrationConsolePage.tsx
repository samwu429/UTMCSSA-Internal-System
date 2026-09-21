import { useMutation, useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useToastController } from '@/app/providers/notifications/useToastController'
import { administrationQueryKeys } from '@/features/administration/console/api/administrationQueryKeys'
import { ApprovalsPane } from '@/features/administration/console/tabs/approvals/ApprovalsPane'
import { DepartmentManagementPane } from '@/features/administration/console/tabs/departments/DepartmentManagementPane'
import { MembershipPlacementPane } from '@/features/administration/console/tabs/memberships/MembershipPlacementPane'
import { PermissionSetEditorPane } from '@/features/administration/console/tabs/roles/PermissionSetEditorPane'
import { useSession } from '@/features/authentication/session/context/useSession'
import { portalQueryKeys } from '@/features/portals/shell/api/portalQueryKeys'
import { Permission } from '@/shared/api/contracts/authorization/permissionIdentifiers'
import { sendBroadcast } from '@/shared/api/endpoints/notifications/messagingEndpoints'
import {
  fetchAuditEntryPage,
  fetchOversightSnapshot,
  fetchPendingRegistrations,
} from '@/shared/api/endpoints/organization/administrationEndpoints'
import { fetchDepartments } from '@/shared/api/endpoints/organization/departmentEndpoints'
import { ADMINISTRATION_PERMISSIONS, hasAnyPermission } from '@/shared/authorization/permissionEvaluation'
import { formatDateTime } from '@/shared/formatting/dateTime/formatDateTime'
import { auditActionLabels } from '@/shared/localization/enumLabels/administrationLabels'
import { EmptyState } from '@/shared/ui/feedback/EmptyState'
import { QueryStateBoundary } from '@/shared/ui/feedback/QueryStateBoundary'
import { Button } from '@/shared/ui/primitives/button/Button'
import { CheckboxField } from '@/shared/ui/primitives/field/CheckboxField'
import { SelectField } from '@/shared/ui/primitives/field/SelectField'
import { TextAreaField } from '@/shared/ui/primitives/field/TextAreaField'
import { TextField } from '@/shared/ui/primitives/field/TextField'
import { PaginationControls } from '@/shared/ui/primitives/pagination/PaginationControls'
import { SegmentedNavigation } from '@/shared/ui/primitives/segmentedNavigation/SegmentedNavigation'
import { StatisticTile } from '@/shared/ui/primitives/statistic/StatisticTile'
import { PageHeading } from '@/shared/ui/primitives/surface/PageHeading'
import { Panel } from '@/shared/ui/primitives/surface/Panel'

type ConsoleTab =
  | 'overview'
  | 'approvals'
  | 'memberships'
  | 'roles'
  | 'departments'
  | 'broadcast'
  | 'audit'

export function AdministrationConsolePage() {
  const { permissions, isPermitted } = useSession()
  const [tab, setTab] = useState<ConsoleTab>('approvals')
  const pendingQuery = useQuery({
    queryKey: administrationQueryKeys.pending(),
    queryFn: ({ signal }) => fetchPendingRegistrations(signal),
    enabled: isPermitted(Permission.ADMIN_REVIEW_REGISTRATIONS),
  })

  if (!hasAnyPermission(permissions, ADMINISTRATION_PERMISSIONS)) {
    return (
      <Panel title="没有管理权限">
        <p className="text-sm text-neutral-600">当前账号不能打开主席团管理后台。</p>
      </Panel>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="管理"
        description="审批、任职、权限与部门结构。"
      />

      <SegmentedNavigation
        label="管理功能"
        items={[
          { id: 'overview', label: '总览' },
          { id: 'approvals', label: '待审批', badgeCount: pendingQuery.data?.length },
          { id: 'memberships', label: '成员归属' },
          { id: 'roles', label: '权限集合' },
          { id: 'departments', label: '部门' },
          { id: 'broadcast', label: '群发邮件' },
          { id: 'audit', label: '操作记录' },
        ]}
        activeItemId={tab}
        onSelect={(id) => {
          setTab(id as ConsoleTab)
        }}
      />

      {tab === 'overview' ? <OverviewPane /> : null}
      {tab === 'approvals' ? <ApprovalsPane /> : null}
      {tab === 'memberships' ? <MembershipPlacementPane /> : null}
      {tab === 'roles' ? <PermissionSetEditorPane /> : null}
      {tab === 'departments' ? <DepartmentManagementPane /> : null}
      {tab === 'broadcast' ? <BroadcastPane /> : null}
      {tab === 'audit' ? <AuditPane /> : null}
    </div>
  )
}

function OverviewPane() {
  const overviewQuery = useQuery({
    queryKey: administrationQueryKeys.overview(),
    queryFn: ({ signal }) => fetchOversightSnapshot(signal),
  })

  return (
    <QueryStateBoundary
      isPending={overviewQuery.isPending}
      error={overviewQuery.error}
      data={overviewQuery.data}
      onRetry={() => {
        void overviewQuery.refetch()
      }}
    >
      {(snapshot) => (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatisticTile label="在册成员" value={snapshot.total_active_members} />
          <StatisticTile label="毕业生" value={snapshot.total_alumni} />
          <StatisticTile label="待审批" value={snapshot.pending_registrations} caption="由部长或副部长处理入部申请" />
          <StatisticTile label="已停用" value={snapshot.suspended_accounts} />
          <StatisticTile label="部门" value={snapshot.departments} />
          <StatisticTile label="文件" value={snapshot.documents} />
          <StatisticTile label="即将到来的活动" value={snapshot.upcoming_activities} />
        </div>
      )}
    </QueryStateBoundary>
  )
}

function BroadcastPane() {
  const toasts = useToastController()
  const departmentsQuery = useQuery({
    queryKey: portalQueryKeys.departments(),
    queryFn: ({ signal }) => fetchDepartments(signal),
  })
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [includeAlumni, setIncludeAlumni] = useState(false)
  const [previewOnly, setPreviewOnly] = useState(true)

  const mutation = useMutation({
    mutationFn: () =>
      sendBroadcast({
        subject,
        body,
        department_id: departmentId === '' ? null : departmentId,
        include_alumni: includeAlumni,
        preview_only: previewOnly,
      }),
    onSuccess: (result) => {
      toasts.showSuccess(
        previewOnly
          ? `预览完成，将发送给 ${result.recipient_count} 人。确认后取消「仅预览」再发送。`
          : `已发送 ${result.sent_count} 封邮件。`,
      )
    },
  })

  return (
    <Panel title="群发活动或通知邮件" description="先预览收件人数，确认无误后再真正发送。">
      <form
        className="space-y-4"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault()
          mutation.mutate()
        }}
      >
        <SelectField
          label="发送范围"
          value={departmentId}
          placeholderLabel="全社团"
          options={(departmentsQuery.data ?? []).map((item) => ({
            value: item.id,
            label: item.name_zh,
          }))}
          onChange={(event) => setDepartmentId(event.target.value)}
        />
        <TextField label="邮件标题" required value={subject} onChange={(event) => setSubject(event.target.value)} />
        <TextAreaField label="正文" required value={body} onChange={(event) => setBody(event.target.value)} />
        <CheckboxField
          label="包含毕业生校友"
          checked={includeAlumni}
          onChange={(event) => setIncludeAlumni(event.target.checked)}
        />
        <CheckboxField
          label="仅预览，先不发送"
          checked={previewOnly}
          onChange={(event) => setPreviewOnly(event.target.checked)}
        />
        <Button type="submit" variant="primary" isBusy={mutation.isPending}>
          {previewOnly ? '预览收件人' : '立即发送'}
        </Button>
      </form>
    </Panel>
  )
}

function AuditPane() {
  const [page, setPage] = useState(1)
  const auditQuery = useQuery({
    queryKey: administrationQueryKeys.audit(page),
    queryFn: ({ signal }) => fetchAuditEntryPage({ page, page_size: 20 }, signal),
  })

  return (
    <Panel title="操作记录">
      <QueryStateBoundary
        isPending={auditQuery.isPending}
        error={auditQuery.error}
        data={auditQuery.data}
        onRetry={() => {
          void auditQuery.refetch()
        }}
      >
        {(pageData) => (
          <>
            {pageData.items.length === 0 ? (
              <EmptyState title="还没有操作记录" />
            ) : (
              <ul className="divide-y divide-neutral-100 text-sm">
                {pageData.items.map((entry) => (
                  <li key={entry.id} className="py-3">
                    <p className="font-medium text-neutral-900">
                      {auditActionLabels[entry.action] ?? entry.action}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {entry.actor_name ?? '系统'} · {formatDateTime(entry.created_at)} · {entry.summary}
                    </p>
                  </li>
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
  )
}

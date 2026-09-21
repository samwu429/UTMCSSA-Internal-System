import { useState } from 'react'
import { AccountStatus } from '@/shared/api/contracts/identity/accountLifecycle'
import type { PendingRegistration } from '@/shared/api/contracts/organization/administration'
import type { RoleSummary } from '@/shared/api/contracts/organization/role'
import {
  approveRegistration,
  changeAccountStatus,
  rejectRegistration,
} from '@/shared/api/endpoints/organization/administrationEndpoints'
import { formatDateTime } from '@/shared/formatting/dateTime/formatDateTime'
import { affiliationLabels } from '@/shared/localization/enumLabels/identityLabels'
import { Button } from '@/shared/ui/primitives/button/Button'
import { SelectField } from '@/shared/ui/primitives/field/SelectField'
import { TextField } from '@/shared/ui/primitives/field/TextField'
import { Panel } from '@/shared/ui/primitives/surface/Panel'
import { composeClassNames } from '@/shared/ui/styling/composeClassNames'
import {
  defaultRoleIdForDepartment,
  rolesAssignableInDepartment,
} from '@/shared/organization/offices'

export function ApprovalCard({
  application,
  departments,
  roles,
  admissionOnly = false,
  onApproved,
  onRejected,
  onFailure,
}: {
  application: PendingRegistration
  departments: readonly { id: string; slug: string; name_zh: string }[]
  roles: readonly RoleSummary[]
  admissionOnly?: boolean
  onApproved: () => Promise<void>
  onRejected: () => Promise<void>
  onFailure: (error: unknown) => void
}) {
  const preferred = departments.find((item) => item.slug === application.requested_department_slug)
  const [departmentId, setDepartmentId] = useState('')
  const [roleId, setRoleId] = useState('')
  const [titleZh, setTitleZh] = useState('')
  const [reason, setReason] = useState('')
  const resolvedDepartmentId = departmentId !== '' ? departmentId : (preferred?.id ?? departments[0]?.id ?? '')
  const resolvedDepartmentSlug =
    departments.find((item) => item.id === resolvedDepartmentId)?.slug ?? ''
  const assignableRoles = rolesAssignableInDepartment(roles, resolvedDepartmentSlug)
  const resolvedRoleId =
    roleId !== '' && assignableRoles.some((role) => role.id === roleId)
      ? roleId
      : defaultRoleIdForDepartment(roles, resolvedDepartmentSlug)

  return (
    <Panel
      title={application.legal_name}
      description={`${application.email} · ${affiliationLabels[application.affiliation]} · 毕业年份 ${application.graduation_year ?? '未填'}`}
    >
      <dl className="mb-3 grid gap-3 text-[13px] sm:grid-cols-3">
        <div>
          <dt className="text-xs text-[var(--ink-muted)]">中文名</dt>
          <dd>{application.chinese_name ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--ink-muted)]">专业</dt>
          <dd>{application.program_of_study ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--ink-muted)]">申请时间</dt>
          <dd>{formatDateTime(application.registered_at)}</dd>
        </div>
      </dl>

      {admissionOnly ? (
        <p className="mb-3 border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-[13px] text-[var(--ink)]">
          通过后，该成员将进入
          {departments.find((item) => item.slug === application.requested_department_slug)?.name_zh ??
            '所选部门'}
          担任部员。
        </p>
      ) : null}

      {admissionOnly ? null : (
        <>
          <SelectField
            label="分配到哪个部门"
            value={resolvedDepartmentId}
            options={departments.map((item) => ({ value: item.id, label: item.name_zh }))}
            onChange={(event) => {
              setDepartmentId(event.target.value)
              setRoleId('')
              setTitleZh('')
            }}
          />

          <fieldset className="mt-4">
            <legend className="mb-2 text-[13px] font-medium text-[var(--ink)]">职务</legend>
            <div className="grid gap-2 md:grid-cols-2">
              {assignableRoles.map((role) => {
                const isSelected = role.id === resolvedRoleId
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      setRoleId(role.id)
                      setTitleZh(role.name_zh)
                    }}
                    className={composeClassNames(
                      'border px-3 py-2.5 text-left',
                      isSelected
                        ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                        : 'border-[var(--line)] hover:border-[var(--line-strong)]',
                    )}
                  >
                    <p className="text-[13px] font-medium text-[var(--ink)]">{role.name_zh}</p>
                    <p className="mt-1 text-xs text-[var(--ink-muted)]">
                      {role.description_zh ?? role.description_en ?? role.name_en}
                    </p>
                  </button>
                )
              })}
            </div>
          </fieldset>

          <TextField
            label="职务称呼（可选）"
            value={titleZh}
            placeholder="例如 部长"
            containerClassName="mt-4"
            onChange={(event) => setTitleZh(event.target.value)}
          />
        </>
      )}

      <TextField
        label="拒绝理由（仅拒绝时填写）"
        value={reason}
        containerClassName="mt-4"
        onChange={(event) => setReason(event.target.value)}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="primary"
          onClick={() => {
            void approveRegistration(application.user_id, {
              department_id: resolvedDepartmentId,
              role_id: resolvedRoleId,
              title_zh:
                titleZh ||
                assignableRoles.find((role) => role.id === resolvedRoleId)?.name_zh ||
                null,
            })
              .then(onApproved)
              .catch(onFailure)
          }}
        >
          {admissionOnly ? '同意进入部门担任部员' : '通过并送入该部门'}
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            void rejectRegistration(application.user_id, {
              reason_zh: reason || '未通过本次注册审核。',
            })
              .then(onRejected)
              .catch(onFailure)
          }}
        >
          拒绝
        </Button>
        {admissionOnly ? null : (
          <Button
            onClick={() => {
              void changeAccountStatus(application.user_id, {
                status: AccountStatus.SUSPENDED,
                reason: '主席团临时冻结',
              })
                .then(onRejected)
                .catch(onFailure)
            }}
          >
            停用账号
          </Button>
        )}
      </div>
    </Panel>
  )
}

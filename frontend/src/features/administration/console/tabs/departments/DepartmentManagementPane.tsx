import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useToastController } from '@/app/providers/notifications/useToastController'
import { PORTAL_MODULE_OPTIONS } from '@/features/organization/departments/registry/portalModuleOptions'
import { portalQueryKeys } from '@/features/portals/shell/api/portalQueryKeys'
import type { DepartmentWithHeadcount } from '@/shared/api/contracts/organization/department'
import {
  createDepartment,
  fetchDepartments,
  updateDepartment,
} from '@/shared/api/endpoints/organization/departmentEndpoints'
import { ColourDotBadge } from '@/shared/ui/primitives/badge/ColourDotBadge'
import { QueryStateBoundary } from '@/shared/ui/feedback/QueryStateBoundary'
import { Dialog } from '@/shared/ui/overlay/dialog/Dialog'
import { Button } from '@/shared/ui/primitives/button/Button'
import { CheckboxField } from '@/shared/ui/primitives/field/CheckboxField'
import { TextAreaField } from '@/shared/ui/primitives/field/TextAreaField'
import { TextField } from '@/shared/ui/primitives/field/TextField'
import { Panel } from '@/shared/ui/primitives/surface/Panel'

export function DepartmentManagementPane() {
  const toasts = useToastController()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<DepartmentWithHeadcount | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const departmentsQuery = useQuery({
    queryKey: portalQueryKeys.departments(),
    queryFn: ({ signal }) => fetchDepartments(signal),
  })

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: portalQueryKeys.departments() })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={() => {
            setIsCreating(true)
          }}
        >
          新增部门
        </Button>
      </div>

      <QueryStateBoundary
        isPending={departmentsQuery.isPending}
        error={departmentsQuery.error}
        data={departmentsQuery.data}
        onRetry={() => {
          void departmentsQuery.refetch()
        }}
      >
        {(departments) => (
          <div className="grid gap-4 md:grid-cols-2">
            {departments.map((department) => (
              <Panel
                key={department.id}
                title={department.name_zh}
                description={department.name_en}
                actions={
                  <Button
                    size="small"
                    onClick={() => {
                      setEditing(department)
                    }}
                  >
                    调整
                  </Button>
                }
              >
                <ColourDotBadge colour={department.accent_color}>
                  {department.member_count} 人
                  {department.pending_count > 0 ? ` · ${department.pending_count} 待审批` : ''}
                </ColourDotBadge>
                <p className="mt-3 text-sm text-neutral-600">{department.summary_zh}</p>
                <p className="mt-2 text-xs text-neutral-500">
                  开放模块：
                  {department.portal_modules
                    .map(
                      (moduleKey) =>
                        PORTAL_MODULE_OPTIONS.find((option) => option.value === moduleKey)?.label_zh ??
                        moduleKey,
                    )
                    .join('、')}
                </p>
              </Panel>
            ))}
          </div>
        )}
      </QueryStateBoundary>

      {isCreating ? (
        <DepartmentEditorDialog
          title="新增部门"
          initial={null}
          onDismiss={() => {
            setIsCreating(false)
          }}
          onSubmit={async (payload) => {
            await createDepartment(payload)
            toasts.showSuccess('部门已创建。成员登录后会进入该部门自己的页面。')
            setIsCreating(false)
            await refresh()
          }}
        />
      ) : null}

      {editing !== null ? (
        <DepartmentEditorDialog
          title={`调整 ${editing.name_zh}`}
          initial={editing}
          onDismiss={() => {
            setEditing(null)
          }}
          onSubmit={async (payload) => {
            await updateDepartment(editing.id, {
              name_zh: payload.name_zh,
              name_en: payload.name_en,
              summary_zh: payload.summary_zh,
              accent_color: payload.accent_color,
              portal_modules: payload.portal_modules,
            })
            toasts.showSuccess('部门页面已更新。')
            setEditing(null)
            await refresh()
          }}
        />
      ) : null}
    </div>
  )
}

function DepartmentEditorDialog({
  title,
  initial,
  onDismiss,
  onSubmit,
}: {
  title: string
  initial: DepartmentWithHeadcount | null
  onDismiss: () => void
  onSubmit: (payload: {
    slug: string
    name_en: string
    name_zh: string
    summary_zh: string | null
    accent_color: string
    portal_modules: string[]
    has_organization_oversight: boolean
    sort_order: number
  }) => Promise<void>
}) {
  const toasts = useToastController()
  const [nameZh, setNameZh] = useState(initial?.name_zh ?? '')
  const [nameEn, setNameEn] = useState(initial?.name_en ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [summaryZh, setSummaryZh] = useState(initial?.summary_zh ?? '')
  const [accent, setAccent] = useState(initial?.accent_color ?? '#2F4858')
  const [modules, setModules] = useState<string[]>(initial?.portal_modules ?? ['overview'])
  const [isSaving, setIsSaving] = useState(false)

  return (
    <Dialog
      isOpen
      title={title}
      description="名称和主色会立刻出现在该部门成员看到的页面上。"
      onDismiss={onDismiss}
      footer={
        <>
          <Button onClick={onDismiss}>取消</Button>
          <Button
            variant="primary"
            isBusy={isSaving}
            onClick={() => {
              setIsSaving(true)
              void onSubmit({
                slug,
                name_en: nameEn || nameZh,
                name_zh: nameZh,
                summary_zh: summaryZh || null,
                accent_color: accent,
                portal_modules: modules,
                has_organization_oversight: initial?.has_organization_oversight ?? false,
                sort_order: initial?.sort_order ?? 100,
              })
                .catch((error: unknown) => {
                  toasts.showRequestFailure(error)
                })
                .finally(() => {
                  setIsSaving(false)
                })
            }}
          >
            保存
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="中文名称" required value={nameZh} onChange={(event) => setNameZh(event.target.value)} />
          <TextField label="英文名称" value={nameEn} onChange={(event) => setNameEn(event.target.value)} />
        </div>
        {initial === null ? (
          <TextField
            label="地址标识（英文小写，例如 media）"
            required
            value={slug}
            onChange={(event) => setSlug(event.target.value.trim().toLowerCase())}
          />
        ) : null}
        <TextAreaField
          label="部门一句话介绍"
          value={summaryZh}
          onChange={(event) => setSummaryZh(event.target.value)}
        />
        <TextField
          label="页面主色"
          type="color"
          value={accent}
          onChange={(event) => setAccent(event.target.value)}
        />
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-neutral-800">这个部门的页面里有哪些功能</legend>
          <div className="grid gap-2 md:grid-cols-2">
            {PORTAL_MODULE_OPTIONS.map((option) => (
              <CheckboxField
                key={option.value}
                label={option.label_zh}
                description={option.label_en}
                checked={modules.includes(option.value)}
                onChange={(event) => {
                  setModules((current) =>
                    event.target.checked
                      ? [...current, option.value]
                      : current.filter((item) => item !== option.value),
                  )
                }}
              />
            ))}
          </div>
        </fieldset>
      </div>
    </Dialog>
  )
}

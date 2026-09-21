import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useToastController } from '@/app/providers/notifications/useToastController'
import { administrationQueryKeys } from '@/features/administration/console/api/administrationQueryKeys'
import { GrantScope } from '@/shared/api/contracts/authorization/grantScope'
import type { PermissionCatalog, RoleDetail, RoleSummary } from '@/shared/api/contracts/organization/role'
import {
  createRole,
  deleteRole,
  fetchPermissionCatalog,
  fetchRoleDetail,
  fetchRoles,
  updateRole,
} from '@/shared/api/endpoints/organization/roleEndpoints'
import { grantScopeLabels } from '@/shared/localization/enumLabels/administrationLabels'
import { QueryStateBoundary } from '@/shared/ui/feedback/QueryStateBoundary'
import { Dialog } from '@/shared/ui/overlay/dialog/Dialog'
import { Button } from '@/shared/ui/primitives/button/Button'
import { CheckboxField } from '@/shared/ui/primitives/field/CheckboxField'
import { SelectField } from '@/shared/ui/primitives/field/SelectField'
import { TextAreaField } from '@/shared/ui/primitives/field/TextAreaField'
import { TextField } from '@/shared/ui/primitives/field/TextField'
import { Panel } from '@/shared/ui/primitives/surface/Panel'
import { useSession } from '@/features/authentication/session/context/useSession'
import { HIDDEN_ROLE_KEYS } from '@/shared/organization/offices'

export function PermissionSetEditorPane() {
  const toasts = useToastController()
  const queryClient = useQueryClient()
  const { profile } = useSession()
  const canSeeHiddenRoles = profile?.is_platform_administrator === true
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const rolesQuery = useQuery({
    queryKey: administrationQueryKeys.roles(),
    queryFn: ({ signal }) => fetchRoles(undefined, signal),
  })
  const catalogQuery = useQuery({
    queryKey: administrationQueryKeys.catalog(),
    queryFn: ({ signal }) => fetchPermissionCatalog(signal),
  })
  const detailQuery = useQuery({
    queryKey: [...administrationQueryKeys.roles(), editingRoleId],
    queryFn: ({ signal }) => fetchRoleDetail(editingRoleId ?? '', signal),
    enabled: editingRoleId !== null,
  })

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: administrationQueryKeys.roles() })
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
          新建权限集合
        </Button>
      </div>

      <QueryStateBoundary
        isPending={rolesQuery.isPending}
        error={rolesQuery.error}
        data={rolesQuery.data}
        onRetry={() => {
          void rolesQuery.refetch()
        }}
      >
        {(roles) => (
          <div className="grid gap-4 md:grid-cols-2">
            {roles
              .filter(
                (role) =>
                  canSeeHiddenRoles || role.key == null || !HIDDEN_ROLE_KEYS.includes(role.key),
              )
              .map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                onEdit={() => {
                  setEditingRoleId(role.id)
                }}
                onDelete={() => {
                  void deleteRole(role.id)
                    .then(async () => {
                      toasts.showSuccess('权限集合已删除。')
                      await refresh()
                    })
                    .catch((error: unknown) => {
                      toasts.showRequestFailure(error)
                    })
                }}
              />
            ))}
          </div>
        )}
      </QueryStateBoundary>

      {catalogQuery.data !== undefined && isCreating ? (
        <RoleEditorDialog
          title="新建权限集合"
          catalog={catalogQuery.data}
          initial={null}
          onDismiss={() => {
            setIsCreating(false)
          }}
          onSubmit={async (payload) => {
            await createRole(payload)
            toasts.showSuccess('权限集合已创建。之后审批成员时可以直接选用。')
            setIsCreating(false)
            await refresh()
          }}
        />
      ) : null}

      {catalogQuery.data !== undefined && editingRoleId !== null && detailQuery.data !== undefined ? (
        <RoleEditorDialog
          title={`编辑 ${detailQuery.data.name_zh}`}
          catalog={catalogQuery.data}
          initial={detailQuery.data}
          onDismiss={() => {
            setEditingRoleId(null)
          }}
          onSubmit={async (payload) => {
            await updateRole(editingRoleId, payload)
            toasts.showSuccess('权限集合已更新。')
            setEditingRoleId(null)
            await refresh()
          }}
        />
      ) : null}
    </div>
  )
}

function RoleCard({
  role,
  onEdit,
  onDelete,
}: {
  role: RoleSummary
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Panel title={role.name_zh} description={`${role.name_en} · ${grantScopeLabels[role.scope]}`}>
      <p className="text-sm text-neutral-700">{role.description_zh ?? role.description_en}</p>
      <p className="mt-2 text-xs text-neutral-500">
        {role.permission_count} 项能力 · {role.assigned_member_count} 人正在使用
        {role.is_system_managed ? ' · 系统预置，可改不可删' : ''}
      </p>
      <div className="mt-4 flex gap-2">
        <Button size="small" onClick={onEdit}>
          编辑能力
        </Button>
        {role.is_system_managed ? null : (
          <Button size="small" variant="danger" onClick={onDelete}>
            删除
          </Button>
        )}
      </div>
    </Panel>
  )
}

function RoleEditorDialog({
  title,
  catalog,
  initial,
  onDismiss,
  onSubmit,
}: {
  title: string
  catalog: PermissionCatalog
  initial: RoleDetail | null
  onDismiss: () => void
  onSubmit: (payload: {
    name_en: string
    name_zh: string
    description_zh: string | null
    scope: typeof GrantScope.DEPARTMENT
    permissions: string[]
    sort_order: number
  }) => Promise<void>
}) {
  const toasts = useToastController()
  const [nameZh, setNameZh] = useState(initial?.name_zh ?? '')
  const [nameEn, setNameEn] = useState(initial?.name_en ?? '')
  const [descriptionZh, setDescriptionZh] = useState(initial?.description_zh ?? '')
  const [scope, setScope] = useState<string>(initial?.scope ?? GrantScope.DEPARTMENT)
  const [selected, setSelected] = useState<string[]>(initial?.permissions ?? [])
  const [isSaving, setIsSaving] = useState(false)

  const toggle = (value: string, checked: boolean) => {
    setSelected((current) =>
      checked ? [...current, value] : current.filter((item) => item !== value),
    )
  }

  return (
    <Dialog
      isOpen
      title={title}
      description="用日常语言勾选这个人能做的事，不要去记英文权限标识。"
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
                name_en: nameEn || nameZh,
                name_zh: nameZh,
                description_zh: descriptionZh || null,
                scope: scope as typeof GrantScope.DEPARTMENT,
                permissions: selected,
                sort_order: initial?.sort_order ?? 80,
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
        <TextAreaField
          label="这段权限给人的感觉"
          value={descriptionZh}
          onChange={(event) => setDescriptionZh(event.target.value)}
        />
        <SelectField
          label="生效范围"
          value={scope}
          options={[
            { value: GrantScope.DEPARTMENT, label: grantScopeLabels[GrantScope.DEPARTMENT] },
            { value: GrantScope.ORGANIZATION, label: grantScopeLabels[GrantScope.ORGANIZATION] },
          ]}
          onChange={(event) => setScope(event.target.value)}
        />
        {catalog.groups.map((group) => (
          <fieldset key={group.key} className="rounded-lg border border-neutral-200 px-4 py-3">
            <legend className="px-1 text-sm font-medium text-neutral-900">{group.label_zh}</legend>
            <div className="mt-2 space-y-2">
              {group.options.map((option) => (
                <CheckboxField
                  key={option.value}
                  label={option.label_zh}
                  description={option.label_en}
                  checked={selected.includes(option.value)}
                  onChange={(event) => {
                    toggle(option.value, event.target.checked)
                  }}
                />
              ))}
            </div>
          </fieldset>
        ))}
      </div>
    </Dialog>
  )
}

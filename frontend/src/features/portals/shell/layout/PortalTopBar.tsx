import { useNavigate } from 'react-router'
import { routePaths } from '@/app/routing/routePaths'
import { SignOutButton } from '@/features/authentication/session/components/SignOutButton'
import { useAuthenticatedMember } from '@/features/authentication/session/context/useAuthenticatedMember'
import { usePortalWorkspace } from '@/features/portals/shell/context/usePortalWorkspace'
import { SelectField } from '@/shared/ui/primitives/field/SelectField'

export function PortalTopBar() {
  const profile = useAuthenticatedMember()
  const { portal, isVisitingForOversight } = usePortalWorkspace()
  const navigate = useNavigate()

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="h-1.5 w-full" style={{ backgroundColor: portal.accent_color }} />
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="size-2.5 rounded-full"
            style={{ backgroundColor: portal.accent_color }}
          />
          <p className="truncate text-base font-semibold text-neutral-900">{portal.name_zh}系统</p>
        </div>
        {isVisitingForOversight ? (
          <p className="mt-0.5 text-xs text-neutral-500">
            监管视图：您正在查看 {portal.name_zh} 的部门页面，操作仍按该部门权限与数据范围执行。
          </p>
        ) : (
          <p className="mt-0.5 truncate text-xs text-neutral-500">
            {portal.summary_zh ?? portal.summary_en}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {profile.memberships.length > 1 ? (
          <SelectField
            label="切换部门"
            value={portal.slug}
            options={profile.memberships.map((membership) => ({
              value: membership.department_slug,
              label: membership.department_name_zh,
            }))}
            onChange={(event) => {
              void navigate(routePaths.portalRoot(event.target.value))
            }}
            containerClassName="min-w-44"
          />
        ) : null}

        <div className="text-right">
          <p className="text-sm font-medium text-neutral-900">{profile.display_name}</p>
          <p className="text-xs text-neutral-500">{profile.email}</p>
        </div>
        <SignOutButton />
      </div>
      </div>
    </header>
  )
}

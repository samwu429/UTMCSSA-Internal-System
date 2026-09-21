import { NavLink } from 'react-router'
import { buildPortalNavigation } from '@/features/portals/shell/navigation/portalNavigation'
import { usePortalWorkspace } from '@/features/portals/shell/context/usePortalWorkspace'
import { useSession } from '@/features/authentication/session/context/useSession'
import { composeClassNames } from '@/shared/ui/styling/composeClassNames'

export function PortalSidebar() {
  const { departmentSlug, portal } = usePortalWorkspace()
  const { permissions } = useSession()
  const items = buildPortalNavigation(departmentSlug, portal.portal_modules, permissions)

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-5 py-5">
        <p className="text-[11px] tracking-wide text-neutral-400 uppercase">UTMCSSA</p>
        <p className="mt-1 text-base font-semibold text-neutral-900">{portal.name_zh}</p>
        <p className="text-xs text-neutral-500">{portal.name_en}</p>
      </div>

      <nav aria-label="部门功能" className="flex flex-1 flex-col gap-0.5 px-3 py-3">
        {items.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            end={item.to === `/portal/${departmentSlug}`}
            className={({ isActive }) =>
              composeClassNames(
                'rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-[var(--portal-accent-soft)] font-medium text-[var(--portal-accent-strong)]'
                  : 'text-neutral-700 hover:bg-neutral-50',
              )
            }
          >
            <span>{item.label}</span>
            <span className="ml-2 text-xs text-neutral-400">{item.englishLabel}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

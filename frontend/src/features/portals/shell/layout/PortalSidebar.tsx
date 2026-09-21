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
    <aside className="flex w-[212px] shrink-0 flex-col bg-[var(--sidebar)] text-[var(--sidebar-text)]">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span
          aria-hidden
          className="size-2 shrink-0"
          style={{ backgroundColor: portal.accent_color }}
        />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-[var(--sidebar-text-active)]">
            {portal.name_zh}
          </p>
          <p className="truncate font-mono text-[10px] tracking-wide text-[var(--sidebar-text)]">
            UTMCSSA
          </p>
        </div>
      </div>

      <nav aria-label="部门功能" className="flex flex-1 flex-col px-2 pb-4">
        {items.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            end={item.to === `/portal/${departmentSlug}`}
            className={({ isActive }) =>
              composeClassNames(
                'flex h-8 items-center px-2.5 text-[13px]',
                isActive
                  ? 'bg-[var(--sidebar-active)] text-[var(--sidebar-text-active)]'
                  : 'hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)]',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { routePaths } from '@/app/routing/routePaths'
import { SignOutButton } from '@/features/authentication/session/components/SignOutButton'
import { useAuthenticatedMember } from '@/features/authentication/session/context/useAuthenticatedMember'
import { useSession } from '@/features/authentication/session/context/useSession'
import { usePortalWorkspace } from '@/features/portals/shell/context/usePortalWorkspace'
import {
  isHiddenPlatformAdministrator,
  officeNameZh,
  resolveAdministratorIdentityLenses,
} from '@/shared/organization/identityCatalog'
import {
  DEPARTMENT_DIRECTOR_ROLE_KEY,
  PLATFORM_ADMINISTRATOR_ROLE_KEY,
  PRESIDIUM_PRESIDENT_ROLE_KEY,
  officeKeysForDepartment,
} from '@/shared/organization/offices'
import { ToolbarSelect } from '@/shared/ui/primitives/field/ToolbarSelect'

export function PortalTopBar() {
  const profile = useAuthenticatedMember()
  const { actingIdentity, actingLens, setActingIdentity } = useSession()
  const { portal, isVisitingForOversight, switchableDepartments } = usePortalWorkspace()
  const navigate = useNavigate()
  const isPlatformAdministrator = isHiddenPlatformAdministrator(profile)
  const identityLenses = useMemo(
    () =>
      resolveAdministratorIdentityLenses(profile, [
        ...switchableDepartments.map((department) => ({
          slug: department.slug,
          name_zh: department.name_zh,
          name_en: department.name_zh,
        })),
        { slug: portal.slug, name_zh: portal.name_zh, name_en: portal.name_en },
      ]),
    [portal.name_en, portal.name_zh, portal.slug, profile, switchableDepartments],
  )

  const departments = useMemo(() => {
    const seen = new Map<string, string>()
    for (const lens of identityLenses) {
      seen.set(lens.department_slug, lens.department_name_zh)
    }
    return [...seen.entries()].map(([slug, name_zh]) => ({ slug, name_zh }))
  }, [identityLenses])

  const selectedDepartmentSlug = actingIdentity?.departmentSlug ?? portal.slug
  const offices = useMemo(() => {
    const fromLenses = identityLenses
      .filter((lens) => lens.department_slug === selectedDepartmentSlug)
      .map((lens) => ({
        key: lens.office_key,
        name_zh: lens.office_name_zh,
      }))
    if (fromLenses.length > 0) {
      return fromLenses
    }
    return officeKeysForDepartment(selectedDepartmentSlug).map((key) => ({
      key,
      name_zh: officeNameZh(key),
    }))
  }, [identityLenses, selectedDepartmentSlug])
  const selectedOfficeKey =
    actingIdentity?.officeKey ??
    (isPlatformAdministrator && portal.slug === selectedDepartmentSlug
      ? (offices.find((office) => office.key === PLATFORM_ADMINISTRATOR_ROLE_KEY)?.key ??
        offices[0]?.key ??
        '')
      : (offices[0]?.key ?? ''))

  const applyIdentity = (departmentSlug: string, officeKey: string) => {
    setActingIdentity({ departmentSlug, officeKey })
    void navigate(routePaths.portalRoot(departmentSlug))
  }

  const statusLine =
    isPlatformAdministrator && actingLens !== null
      ? `预览 ${actingLens.department_name_zh}${actingLens.office_name_zh}`
      : isVisitingForOversight
        ? `监管 · ${portal.name_zh}`
        : null

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-[var(--line)] bg-[var(--surface)] px-4">
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-[var(--ink)]">{portal.name_zh}</p>
        {statusLine !== null ? (
          <p className="truncate text-[11px] text-[var(--ink-faint)]">{statusLine}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {isPlatformAdministrator && departments.length > 0 ? (
          <>
            <ToolbarSelect
              label="部门"
              value={selectedDepartmentSlug}
              options={departments.map((department) => ({
                value: department.slug,
                label: department.name_zh,
              }))}
              onChange={(event) => {
                const slug = event.target.value
                const preferred = officeKeysForDepartment(slug)[0] ?? DEPARTMENT_DIRECTOR_ROLE_KEY
                const fallback =
                  slug === 'presidium' ? PRESIDIUM_PRESIDENT_ROLE_KEY : preferred
                applyIdentity(slug, fallback)
              }}
            />
            <ToolbarSelect
              label="职位"
              value={selectedOfficeKey}
              options={offices.map((office) => ({
                value: office.key,
                label: office.name_zh,
              }))}
              onChange={(event) => {
                applyIdentity(selectedDepartmentSlug, event.target.value)
              }}
            />
          </>
        ) : switchableDepartments.length > 1 ? (
          <ToolbarSelect
            label="部门"
            value={portal.slug}
            options={switchableDepartments.map((department) => ({
              value: department.slug,
              label: department.name_zh,
            }))}
            onChange={(event) => {
              void navigate(routePaths.portalRoot(event.target.value))
            }}
          />
        ) : null}

        <div className="hidden text-right sm:block">
          <p className="text-[12px] text-[var(--ink)]">
            {actingLens !== null
              ? `${actingLens.department_name_zh}${actingLens.office_name_zh}`
              : profile.display_name}
          </p>
          <p className="font-mono text-[10px] text-[var(--ink-faint)]">{profile.email}</p>
        </div>
        <SignOutButton variant="ghost" />
      </div>
    </header>
  )
}

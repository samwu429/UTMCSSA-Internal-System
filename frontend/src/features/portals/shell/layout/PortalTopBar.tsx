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
import { SelectField } from '@/shared/ui/primitives/field/SelectField'

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
        {isPlatformAdministrator && actingLens !== null ? (
          <p className="mt-0.5 text-xs text-neutral-500">
            仅你可见。当前按{actingLens.department_name_zh}
            {actingLens.office_name_zh}的权限查看。
          </p>
        ) : isVisitingForOversight ? (
          <p className="mt-0.5 text-xs text-neutral-500">
            已切换到{portal.name_zh}自己的页面。操作按你当前职务权限进行。
          </p>
        ) : (
          <p className="mt-0.5 truncate text-xs text-neutral-500">
            {portal.summary_zh ?? portal.summary_en}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {isPlatformAdministrator && departments.length > 0 ? (
          <>
            <SelectField
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
              containerClassName="min-w-40"
            />
            <SelectField
              label="职位"
              value={selectedOfficeKey}
              options={offices.map((office) => ({
                value: office.key,
                label: office.name_zh,
              }))}
              onChange={(event) => {
                applyIdentity(selectedDepartmentSlug, event.target.value)
              }}
              containerClassName="min-w-40"
            />
          </>
        ) : switchableDepartments.length > 1 ? (
          <SelectField
            label="切换部门系统"
            value={portal.slug}
            options={switchableDepartments.map((department) => ({
              value: department.slug,
              label: department.name_zh,
            }))}
            onChange={(event) => {
              void navigate(routePaths.portalRoot(event.target.value))
            }}
            containerClassName="min-w-52"
          />
        ) : null}

        <div className="text-right">
          <p className="text-sm font-medium text-neutral-900">
            {actingLens !== null
              ? `${actingLens.department_name_zh}${actingLens.office_name_zh}`
              : profile.display_name}
          </p>
          <p className="text-xs text-neutral-500">{profile.email}</p>
        </div>
        <SignOutButton />
      </div>
      </div>
    </header>
  )
}

import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { portalSegments } from '@/app/routing/portalSegments'
import { routePaths } from '@/app/routing/routePaths'
import { activityQueryKeys } from '@/features/activities/calendar/api/activityQueryKeys'
import { documentQueryKeys } from '@/features/documents/vault/api/documentQueryKeys'
import { memberQueryKeys } from '@/features/directory/members/api/memberQueryKeys'
import { welcomeCopyFor } from '@/features/portals/overview/copy/departmentWelcomeCopy'
import { usePortalWorkspace } from '@/features/portals/shell/context/usePortalWorkspace'
import { useAuthenticatedMember } from '@/features/authentication/session/context/useAuthenticatedMember'
import { fetchActivities } from '@/shared/api/endpoints/activities/activityEndpoints'
import { fetchAnnouncements } from '@/shared/api/endpoints/activities/announcementEndpoints'
import { fetchDocumentPage } from '@/shared/api/endpoints/documents/documentEndpoints'
import { fetchMemberPage } from '@/shared/api/endpoints/directory/memberEndpoints'
import { formatDateTime } from '@/shared/formatting/dateTime/formatDateTime'
import { PageHeading } from '@/shared/ui/primitives/surface/PageHeading'
import { Panel } from '@/shared/ui/primitives/surface/Panel'
import { StatisticTile } from '@/shared/ui/primitives/statistic/StatisticTile'

export function DepartmentOverviewPage() {
  const profile = useAuthenticatedMember()
  const { portal, department } = usePortalWorkspace()
  const copy = welcomeCopyFor(portal.slug)
  const departmentId = portal.has_organization_oversight ? undefined : portal.department_id

  const membersQuery = useQuery({
    queryKey: memberQueryKeys.page({ department_id: departmentId, page: 1, page_size: 5 }),
    queryFn: ({ signal }) =>
      fetchMemberPage({ department_id: departmentId, page: 1, page_size: 5 }, signal),
  })
  const activitiesQuery = useQuery({
    queryKey: activityQueryKeys.list({ department_id: departmentId }),
    queryFn: ({ signal }) => fetchActivities({ department_id: departmentId }, signal),
  })
  const announcementsQuery = useQuery({
    queryKey: activityQueryKeys.announcements(departmentId),
    queryFn: ({ signal }) => fetchAnnouncements(departmentId, signal),
  })
  const documentsQuery = useQuery({
    queryKey: documentQueryKeys.page({ department_id: departmentId, page: 1, page_size: 5 }),
    queryFn: ({ signal }) =>
      fetchDocumentPage({ department_id: departmentId, page: 1, page_size: 5 }, signal),
  })

  return (
    <div className="space-y-4">
      <PageHeading title={copy.headline} description={copy.focus} />

      <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">
        <StatisticTile
          label="成员"
          value={membersQuery.data?.total ?? department?.member_count ?? '—'}
          caption={profile.affiliation === 'alumnus' ? '含校友' : '在册'}
        />
        <StatisticTile label="活动" value={activitiesQuery.data?.length ?? '—'} />
        <StatisticTile label="文件" value={documentsQuery.data?.total ?? '—'} />
        <StatisticTile
          label="毕业年份"
          value={profile.graduation_year ?? '—'}
          caption={profile.program_of_study ?? undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="公告"
          actions={
            <Link
              to={routePaths.portalSection(portal.slug, portalSegments.announcements)}
              className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]"
            >
              全部
            </Link>
          }
        >
          <ul className="divide-y divide-[var(--line)]">
            {(announcementsQuery.data ?? []).slice(0, 5).map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <p className="truncate text-[13px] text-[var(--ink)]">{item.title}</p>
                <p className="shrink-0 font-mono text-[11px] text-[var(--ink-faint)]">
                  {formatDateTime(item.published_at)}
                </p>
              </li>
            ))}
          </ul>
          {(announcementsQuery.data ?? []).length === 0 ? (
            <p className="text-[13px] text-[var(--ink-faint)]">无</p>
          ) : null}
        </Panel>

        <Panel
          title="活动"
          actions={
            <Link
              to={routePaths.portalSection(portal.slug, portalSegments.activities)}
              className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]"
            >
              日历
            </Link>
          }
        >
          <ul className="divide-y divide-[var(--line)]">
            {(activitiesQuery.data ?? []).slice(0, 5).map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <p className="truncate text-[13px] text-[var(--ink)]">{item.title}</p>
                <p className="shrink-0 font-mono text-[11px] text-[var(--ink-faint)]">
                  {formatDateTime(item.starts_at)}
                </p>
              </li>
            ))}
          </ul>
          {(activitiesQuery.data ?? []).length === 0 ? (
            <p className="text-[13px] text-[var(--ink-faint)]">无</p>
          ) : null}
        </Panel>
      </div>
    </div>
  )
}

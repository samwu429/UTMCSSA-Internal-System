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
import { Button } from '@/shared/ui/primitives/button/Button'
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
    <div className="space-y-6">
      <PageHeading
        title={copy.headline}
        englishTitle={portal.name_en}
        description={`${copy.focus} ${copy.firstAction}`}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatisticTile
          label="本页成员"
          value={membersQuery.data?.total ?? department?.member_count ?? '—'}
          caption={profile.affiliation === 'alumnus' ? '含校友联络人' : '含在校成员'}
        />
        <StatisticTile
          label="近期活动"
          value={activitiesQuery.data?.length ?? '—'}
          caption="日历中可见的活动"
        />
        <StatisticTile
          label="文件"
          value={documentsQuery.data?.total ?? '—'}
          caption="当前分类下可打开的文档"
        />
        <StatisticTile
          label="毕业年份"
          value={profile.graduation_year ?? '—'}
          caption={profile.program_of_study ?? '未填写专业'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="部门公告" description="本部门与面向全社的通知。">
          <ul className="space-y-3">
            {(announcementsQuery.data ?? []).slice(0, 4).map((item) => (
              <li key={item.id}>
                <p className="text-sm font-medium text-neutral-900">{item.title}</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {item.author_name ?? '未署名'} · {formatDateTime(item.published_at)}
                </p>
              </li>
            ))}
          </ul>
          {(announcementsQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-neutral-500">暂时没有公告。</p>
          ) : null}
          <div className="mt-4">
            <Link to={routePaths.portalSection(portal.slug, portalSegments.announcements)}>
              <Button size="small">查看全部公告</Button>
            </Link>
          </div>
        </Panel>

        <Panel title="即将到来的活动" description="发布后会出现在每日邮件摘要里。">
          <ul className="space-y-3">
            {(activitiesQuery.data ?? []).slice(0, 4).map((item) => (
              <li key={item.id}>
                <p className="text-sm font-medium text-neutral-900">{item.title}</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {formatDateTime(item.starts_at)}
                  {item.location != null && item.location !== '' ? ` · ${item.location}` : ''}
                </p>
              </li>
            ))}
          </ul>
          {(activitiesQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-neutral-500">近期没有已登记的活动。</p>
          ) : null}
          <div className="mt-4">
            <Link to={routePaths.portalSection(portal.slug, portalSegments.activities)}>
              <Button size="small">打开活动日历</Button>
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { administrationQueryKeys } from '@/features/administration/console/api/administrationQueryKeys'
import { memberQueryKeys } from '@/features/directory/members/api/memberQueryKeys'
import { activityQueryKeys } from '@/features/activities/calendar/api/activityQueryKeys'
import { fetchOversightSnapshot } from '@/shared/api/endpoints/organization/administrationEndpoints'
import { fetchMemberPage } from '@/shared/api/endpoints/directory/memberEndpoints'
import { fetchActivities } from '@/shared/api/endpoints/activities/activityEndpoints'
import { fetchDepartments } from '@/shared/api/endpoints/organization/departmentEndpoints'
import { portalQueryKeys } from '@/features/portals/shell/api/portalQueryKeys'
import { ColourDotBadge } from '@/shared/ui/primitives/badge/ColourDotBadge'
import { QueryStateBoundary } from '@/shared/ui/feedback/QueryStateBoundary'
import { PageHeading } from '@/shared/ui/primitives/surface/PageHeading'
import { Panel } from '@/shared/ui/primitives/surface/Panel'
import { StatisticTile } from '@/shared/ui/primitives/statistic/StatisticTile'
import { formatDateTime } from '@/shared/formatting/dateTime/formatDateTime'

export function OversightPage() {
  const overviewQuery = useQuery({
    queryKey: administrationQueryKeys.overview(),
    queryFn: ({ signal }) => fetchOversightSnapshot(signal),
  })
  const departmentsQuery = useQuery({
    queryKey: portalQueryKeys.departments(),
    queryFn: ({ signal }) => fetchDepartments(signal),
  })
  const membersQuery = useQuery({
    queryKey: memberQueryKeys.page({ page: 1, page_size: 8 }),
    queryFn: ({ signal }) => fetchMemberPage({ page: 1, page_size: 8 }, signal),
  })
  const activitiesQuery = useQuery({
    queryKey: activityQueryKeys.list({}),
    queryFn: ({ signal }) => fetchActivities({}, signal),
  })

  return (
    <div className="space-y-6">
      <PageHeading
        title="跨部门监管"
        englishTitle="Oversight"
        description="主席团和行政部从这里查看全社数据。各部门自己的页面不会出现这些汇总，以免打破「各部独立系统」的使用感受。"
      />

      <QueryStateBoundary
        isPending={overviewQuery.isPending}
        error={overviewQuery.error}
        data={overviewQuery.data}
        onRetry={() => {
          void overviewQuery.refetch()
        }}
      >
        {(snapshot) => (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatisticTile label="在册成员" value={snapshot.total_active_members} />
            <StatisticTile label="毕业生" value={snapshot.total_alumni} />
            <StatisticTile label="待审批" value={snapshot.pending_registrations} />
            <StatisticTile label="近期活动" value={snapshot.upcoming_activities} />
          </div>
        )}
      </QueryStateBoundary>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="各部门人数">
          <ul className="space-y-2">
            {(departmentsQuery.data ?? []).map((department) => (
              <li key={department.id} className="flex items-center justify-between gap-3 text-sm">
                <ColourDotBadge colour={department.accent_color}>{department.name_zh}</ColourDotBadge>
                <span className="text-neutral-600">{department.member_count} 人</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="全社近期活动">
          <ul className="space-y-2 text-sm">
            {(activitiesQuery.data ?? []).slice(0, 6).map((activity) => (
              <li key={activity.id}>
                <p className="font-medium text-neutral-900">{activity.title}</p>
                <p className="text-xs text-neutral-500">
                  {activity.department_name_zh} · {formatDateTime(activity.starts_at)}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="最近加入的成员">
        <ul className="space-y-2 text-sm">
          {(membersQuery.data?.items ?? []).map((member) => (
            <li key={member.user_id} className="flex justify-between gap-3">
              <span>
                {member.display_name}
                {member.graduation_year != null ? ` · ${member.graduation_year}` : ''}
              </span>
              <span className="text-neutral-500">
                {member.departments.map((item) => item.name_zh).join('、') || '未分部门'}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}

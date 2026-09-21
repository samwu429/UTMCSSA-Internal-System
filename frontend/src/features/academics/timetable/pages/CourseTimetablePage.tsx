import { useQuery } from '@tanstack/react-query'
import { OwnCourseEnrolmentEditor } from '@/features/academics/timetable/components/OwnCourseEnrolmentEditor'
import { previewDailyDigest } from '@/shared/api/endpoints/notifications/messagingEndpoints'
import { formatWallClockTime } from '@/shared/formatting/dateTime/formatDateTime'
import { PageHeading } from '@/shared/ui/primitives/surface/PageHeading'
import { Panel } from '@/shared/ui/primitives/surface/Panel'

export function CourseTimetablePage() {
  const digestQuery = useQuery({
    queryKey: ['digest-preview'],
    queryFn: ({ signal }) => previewDailyDigest(signal),
  })

  return (
    <div className="space-y-6">
      <PageHeading title="学术" description="本学期课表；晨间邮件会带上当天课程与活动。" />

      <Panel title="今日邮件预览">
        {digestQuery.data === undefined ? (
          <p className="text-[13px] text-[var(--ink-faint)]">载入中…</p>
        ) : (
          <div className="space-y-2 text-sm text-neutral-700">
            <p>
              {digestQuery.data.digest_date} {digestQuery.data.weekday_zh}
            </p>
            {digestQuery.data.weather != null ? (
              <p>
                天气：{digestQuery.data.weather.condition_zh}
                {digestQuery.data.weather.temperature_high_celsius != null
                  ? `，最高 ${digestQuery.data.weather.temperature_high_celsius}°C`
                  : ''}
              </p>
            ) : null}
            <p>
              今日课程：
              {digestQuery.data.courses.length === 0
                ? '无'
                : digestQuery.data.courses
                    .map((course) => `${course.course_code} ${formatWallClockTime(course.starts_at)}`)
                    .join('；')}
            </p>
            <p>
              今日活动：
              {digestQuery.data.activities.length === 0
                ? '无'
                : digestQuery.data.activities.map((activity) => activity.title).join('；')}
            </p>
          </div>
        )}
      </Panel>

      <OwnCourseEnrolmentEditor />
    </div>
  )
}

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
      <PageHeading
        title="学术支持与课表"
        englishTitle="Academic"
        description="把本学期课程写进系统后，每天早晨的邮件会带上当天课程、社团活动、天气和日期。"
      />

      <Panel title="今日邮件预览" description="与明天早上会发出的摘要相同。">
        {digestQuery.data === undefined ? (
          <p className="text-sm text-neutral-500">正在生成预览…</p>
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

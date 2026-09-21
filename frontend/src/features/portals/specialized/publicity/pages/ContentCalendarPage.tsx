import { ActivityCalendarPage } from '@/features/activities/calendar/pages/ActivityCalendarPage'
import { PageHeading } from '@/shared/ui/primitives/surface/PageHeading'
import { Panel } from '@/shared/ui/primitives/surface/Panel'

export function ContentCalendarPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="宣传排期"
        englishTitle="Content calendar"
        description="宣传部把发布节点登记为活动后，全社成员会在每日邮件里看到当天要配合的宣传节点。"
      />
      <Panel title="建议登记方式">
        <p className="text-sm text-neutral-700">
          将「海报交付」「推送上线」「现场拍照」写成独立节点，开始时间填实际发布时间。发布时可勾选邮件通知，让活动部和对接同学按时配合。
        </p>
      </Panel>
      <ActivityCalendarPage hideHeading />
    </div>
  )
}

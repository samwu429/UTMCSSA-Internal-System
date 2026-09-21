import { ActivityCalendarPage } from '@/features/activities/calendar/pages/ActivityCalendarPage'
import { PageHeading } from '@/shared/ui/primitives/surface/PageHeading'

export function ContentCalendarPage() {
  return (
    <div className="space-y-4">
      <PageHeading title="排期" description="宣传节点按活动登记后会出现在每日邮件里。" />
      <ActivityCalendarPage hideHeading />
    </div>
  )
}

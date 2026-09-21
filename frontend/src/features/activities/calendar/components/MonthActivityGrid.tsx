import type { ActivitySummary } from '@/shared/api/contracts/activities/activity'
import { formatClockTime, formatMonthLabel } from '@/shared/formatting/dateTime/formatDateTime'
import { monthGridWeekdayHeadings } from '@/shared/localization/calendar/weekdayNames'

function startOfMonth(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), 1)
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

/**
 * A Monday-first month grid that only lists activities, so a department can scan the month without
 * leaving its own calendar page.
 *
 * 周一为一周起始的月历，只展示活动，使部门无需离开自己的日历页即可浏览整月安排。
 */
export function MonthActivityGrid({
  month,
  activities,
}: {
  month: Date
  activities: readonly ActivitySummary[]
}) {
  const firstDay = startOfMonth(month)
  const weekdayIndex = (firstDay.getDay() + 6) % 7
  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const days = Array.from(
    { length: dayCount },
    (_, offset) => new Date(month.getFullYear(), month.getMonth(), offset + 1),
  )

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-neutral-800">{formatMonthLabel(month)}</p>
      <div className="grid grid-cols-7 gap-1 text-xs">
        {monthGridWeekdayHeadings.map((heading) => (
          <div key={heading} className="px-1 py-1 text-center text-neutral-500">
            {heading}
          </div>
        ))}
        {days.map((day, offset) => {
          const dayActivities = activities.filter((activity) => isSameDay(new Date(activity.starts_at), day))
          return (
            <div
              key={day.toISOString()}
              className="min-h-20 rounded-md border border-neutral-200 bg-white px-1.5 py-1"
              style={offset === 0 ? { gridColumnStart: weekdayIndex + 1 } : undefined}
            >
              <p className="text-neutral-500">{day.getDate()}</p>
              {dayActivities.slice(0, 2).map((activity) => (
                <p key={activity.id} className="mt-1 truncate text-[11px] text-[var(--portal-accent-strong)]">
                  {formatClockTime(activity.starts_at)} {activity.title}
                </p>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

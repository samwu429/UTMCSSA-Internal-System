/**
 * Weekday labels keyed by ISO number, where 1 is Monday and 7 is Sunday, matching the timetable
 * contract rather than the JavaScript `Date` convention that starts the week on Sunday at 0.
 *
 * 按 ISO 编号索引的星期名称（1 为周一，7 为周日），与课表接口一致，
 * 而非 JavaScript Date 以 0 表示周日的约定。
 */
export const isoWeekdayLabels: Record<number, string> = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日',
}

export const isoWeekdayOrder: readonly number[] = [1, 2, 3, 4, 5, 6, 7]

/** Column headings for a Monday-first month grid. */
export const monthGridWeekdayHeadings: readonly string[] = [
  '一',
  '二',
  '三',
  '四',
  '五',
  '六',
  '日',
]

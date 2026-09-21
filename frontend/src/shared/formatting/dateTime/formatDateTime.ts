const LOCALE = 'zh-CN'

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const monthFormatter = new Intl.DateTimeFormat(LOCALE, {
  year: 'numeric',
  month: 'long',
})

const PLACEHOLDER = '—'

function toDate(value: string | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') {
    return null
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatDate(value: string | null | undefined): string {
  const parsed = toDate(value)
  return parsed === null ? PLACEHOLDER : dateFormatter.format(parsed)
}

export function formatDateTime(value: string | null | undefined): string {
  const parsed = toDate(value)
  return parsed === null ? PLACEHOLDER : dateTimeFormatter.format(parsed)
}

export function formatClockTime(value: string | null | undefined): string {
  const parsed = toDate(value)
  return parsed === null ? PLACEHOLDER : timeFormatter.format(parsed)
}

export function formatMonthLabel(value: Date): string {
  return monthFormatter.format(value)
}

/**
 * Render a span as a single line, collapsing the repeated date when both ends fall on one day.
 *
 * 将时间段渲染为一行；若起止在同一天则省略重复的日期部分。
 */
export function formatDateTimeRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  const startDate = toDate(start)
  if (startDate === null) {
    return PLACEHOLDER
  }

  const endDate = toDate(end)
  if (endDate === null) {
    return dateTimeFormatter.format(startDate)
  }

  const sameCalendarDay = startDate.toDateString() === endDate.toDateString()
  return sameCalendarDay
    ? `${dateTimeFormatter.format(startDate)} - ${timeFormatter.format(endDate)}`
    : `${dateTimeFormatter.format(startDate)} - ${dateTimeFormatter.format(endDate)}`
}

/**
 * Wall-clock strings such as `14:30:00` arrive without a date, so they are trimmed rather than
 * parsed as an instant.
 *
 * 形如 14:30:00 的时刻字符串不含日期，直接截断展示而非按时间点解析。
 */
export function formatWallClockTime(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return PLACEHOLDER
  }
  const [hours, minutes] = value.split(':')
  if (hours === undefined || minutes === undefined) {
    return value
  }
  return `${hours}:${minutes}`
}

/**
 * Bridges between the `datetime-local` input value and the ISO instant the API expects.
 *
 * The control speaks local wall-clock time without an offset, so a plain string swap would shift
 * every activity by the browser's timezone difference.
 *
 * 在 datetime-local 控件值与接口所需的 ISO 时间点之间转换。
 * 该控件使用不带时区偏移的本地时间，直接拼接字符串会让活动时间整体偏移浏览器所在时区的差值。
 */
export function toLocalInputValue(isoInstant: string | null | undefined): string {
  if (isoInstant === null || isoInstant === undefined || isoInstant === '') {
    return ''
  }
  const parsed = new Date(isoInstant)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }
  const offsetMilliseconds = parsed.getTimezoneOffset() * 60_000
  return new Date(parsed.getTime() - offsetMilliseconds).toISOString().slice(0, 16)
}

export function fromLocalInputValue(localValue: string): string | null {
  if (localValue === '') {
    return null
  }
  const parsed = new Date(localValue)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

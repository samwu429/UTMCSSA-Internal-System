export type QueryParameterValue = string | number | boolean | null | undefined

/**
 * Serialize query parameters, dropping entries the caller left empty.
 *
 * An absent filter and a filter set to the empty string mean the same thing to the member but
 * different things to the backend, so empty values are omitted rather than sent.
 *
 * 未设置的筛选条件与空字符串对成员而言含义相同，对后端却不同，因此空值直接省略而非发送。
 */
export function buildQueryString(parameters: Record<string, QueryParameterValue>): string {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(parameters)) {
    if (value === null || value === undefined || value === '') {
      continue
    }
    search.append(key, String(value))
  }

  const serialized = search.toString()
  return serialized.length > 0 ? `?${serialized}` : ''
}

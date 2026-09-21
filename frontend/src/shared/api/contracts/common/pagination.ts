/**
 * The page envelope every paginated endpoint returns.
 *
 * 所有分页接口共用的返回结构。
 */
export interface PaginatedCollection<TItem> {
  items: TItem[]
  total: number
  page: number
  page_size: number
}

/**
 * Query parameters accepted by every paginated endpoint.
 *
 * 所有分页接口共用的查询参数。
 */
export interface PaginationQuery {
  page?: number
  page_size?: number
}

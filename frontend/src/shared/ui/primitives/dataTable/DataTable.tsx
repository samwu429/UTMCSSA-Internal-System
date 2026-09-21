import type { ReactNode } from 'react'
import type { DataTableColumn } from '@/shared/ui/primitives/dataTable/dataTableTypes'
import { composeClassNames } from '@/shared/ui/styling/composeClassNames'

export interface DataTableProps<TRow> {
  caption: string
  columns: ReadonlyArray<DataTableColumn<TRow>>
  rows: readonly TRow[]
  extractRowKey: (row: TRow) => string
  emptyState: ReactNode
  isLoading?: boolean
  /** Rendered directly beneath a row, used for inline expansion such as approval forms. */
  renderExpandedRow?: (row: TRow) => ReactNode
}

export function DataTable<TRow>({
  caption,
  columns,
  rows,
  extractRowKey,
  emptyState,
  isLoading = false,
  renderExpandedRow,
}: DataTableProps<TRow>) {
  if (!isLoading && rows.length === 0) {
    return <div className="px-5 py-10">{emptyState}</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-[var(--line)] bg-[var(--paper)]">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={composeClassNames(
                  'px-3 py-2 text-[11px] font-medium text-[var(--ink-muted)]',
                  column.alignment === 'right' ? 'text-right' : 'text-left',
                  column.isSecondary === true && 'hidden lg:table-cell',
                  column.widthClassName,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const rowKey = extractRowKey(row)
            const expanded = renderExpandedRow?.(row)
            return (
              <tr key={rowKey} className="border-b border-[var(--line)] align-middle last:border-b-0 hover:bg-[#f7f8fa]">
                {expanded == null ? (
                  columns.map((column) => (
                    <td
                      key={column.key}
                      className={composeClassNames(
                        'px-3 py-2 text-[13px] text-[var(--ink)]',
                        column.alignment === 'right' ? 'text-right' : 'text-left',
                        column.isSecondary === true && 'hidden lg:table-cell',
                      )}
                    >
                      {column.renderCell(row)}
                    </td>
                  ))
                ) : (
                  <td colSpan={columns.length} className="px-0 py-0">
                    {expanded}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
      {isLoading ? (
        <p className="px-4 py-3 text-xs text-neutral-500" role="status">
          正在加载…
        </p>
      ) : null}
    </div>
  )
}

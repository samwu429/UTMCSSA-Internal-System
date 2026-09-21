import type { ReactNode } from 'react'

export interface DataTableColumn<TRow> {
  /** Stable key used for the column element; not a field path. */
  key: string
  header: ReactNode
  renderCell: (row: TRow) => ReactNode
  /** Columns marked secondary collapse away at tablet width. */
  isSecondary?: boolean
  alignment?: 'left' | 'right'
  widthClassName?: string
}

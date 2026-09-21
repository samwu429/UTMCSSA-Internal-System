import { Button } from '@/shared/ui/primitives/button/Button'

export interface PaginationControlsProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export function PaginationControls({
  page,
  pageSize,
  total,
  onPageChange,
}: PaginationControlsProps) {
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, pageSize)))
  const firstRowIndex = total === 0 ? 0 : (page - 1) * pageSize + 1
  const lastRowIndex = Math.min(page * pageSize, total)

  return (
    <nav
      aria-label="分页导航"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] px-4 py-2.5"
    >
      <p className="text-xs text-[var(--ink-muted)]">
        第 {firstRowIndex} - {lastRowIndex} 条，共 {total} 条
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="small"
          disabled={page <= 1}
          onClick={() => {
            onPageChange(page - 1)
          }}
        >
          上一页
        </Button>
        <span className="font-mono text-xs text-[var(--ink-muted)]">
          {page} / {pageCount}
        </span>
        <Button
          size="small"
          disabled={page >= pageCount}
          onClick={() => {
            onPageChange(page + 1)
          }}
        >
          下一页
        </Button>
      </div>
    </nav>
  )
}

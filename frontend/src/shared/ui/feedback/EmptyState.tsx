import type { ReactNode } from 'react'

export interface EmptyStateProps {
  title: string
  description?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-1 py-5">
      <p className="text-[13px] text-[var(--ink)]">{title}</p>
      {description !== undefined ? (
        <p className="max-w-md text-xs text-[var(--ink-muted)]">{description}</p>
      ) : null}
      {action !== undefined ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}

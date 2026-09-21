import type { ReactNode } from 'react'

export interface EmptyStateProps {
  title: string
  description?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <p className="text-sm font-medium text-neutral-700">{title}</p>
      {description !== undefined ? (
        <p className="max-w-md text-xs text-neutral-500">{description}</p>
      ) : null}
      {action !== undefined ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}

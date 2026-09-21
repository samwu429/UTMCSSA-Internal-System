import type { ReactNode } from 'react'

export interface PageHeadingProps {
  title: string
  englishTitle?: string
  description?: ReactNode
  actions?: ReactNode
}

export function PageHeading({ title, description, actions }: PageHeadingProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--line)] pb-3">
      <div className="min-w-0">
        <h1 className="text-[17px] font-semibold text-[var(--ink)]">{title}</h1>
        {description !== undefined ? (
          <p className="mt-1 max-w-3xl text-xs text-[var(--ink-muted)]">{description}</p>
        ) : null}
      </div>
      {actions !== undefined ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}

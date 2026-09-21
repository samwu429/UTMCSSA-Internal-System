import type { ReactNode } from 'react'

export interface PageHeadingProps {
  title: string
  /** Secondary English label, shown smaller beside the Chinese title. */
  englishTitle?: string
  description?: ReactNode
  actions?: ReactNode
}

export function PageHeading({ title, englishTitle, description, actions }: PageHeadingProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">{title}</h1>
          {englishTitle !== undefined ? (
            <span className="text-sm text-neutral-400">{englishTitle}</span>
          ) : null}
        </div>
        {description !== undefined ? (
          <p className="mt-1.5 max-w-3xl text-sm text-neutral-600">{description}</p>
        ) : null}
      </div>
      {actions !== undefined ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}

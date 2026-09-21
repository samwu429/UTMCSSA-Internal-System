import type { ReactNode } from 'react'
import { composeClassNames } from '@/shared/ui/styling/composeClassNames'

export interface PanelProps {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  bodyClassName?: string
  className?: string
  children: ReactNode
}

export function Panel({
  title,
  description,
  actions,
  bodyClassName,
  className,
  children,
}: PanelProps) {
  const hasHeader = title !== undefined || description !== undefined || actions !== undefined

  return (
    <section
      className={composeClassNames(
        'rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)]',
        className,
      )}
    >
      {hasHeader ? (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-2.5">
          <div className="min-w-0">
            {title !== undefined ? (
              <h2 className="text-[13px] font-semibold text-[var(--ink)]">{title}</h2>
            ) : null}
            {description !== undefined ? (
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">{description}</p>
            ) : null}
          </div>
          {actions !== undefined ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </header>
      ) : null}
      <div className={composeClassNames('px-4 py-3', bodyClassName)}>{children}</div>
    </section>
  )
}

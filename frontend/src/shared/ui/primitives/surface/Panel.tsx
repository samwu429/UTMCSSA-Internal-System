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

/**
 * The single elevated surface used across the application; elevation is a hairline border plus a
 * very small shadow, never a stronger treatment.
 *
 * 全站统一的承载面：层次仅由一像素描边与极弱阴影表达，不使用更强的视觉效果。
 */
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
        'rounded-lg border border-neutral-200 bg-white shadow-xs',
        className,
      )}
    >
      {hasHeader ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-200 px-5 py-4">
          <div className="min-w-0">
            {title !== undefined ? (
              <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
            ) : null}
            {description !== undefined ? (
              <p className="mt-1 text-sm text-neutral-500">{description}</p>
            ) : null}
          </div>
          {actions !== undefined ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </header>
      ) : null}
      <div className={composeClassNames('px-5 py-4', bodyClassName)}>{children}</div>
    </section>
  )
}

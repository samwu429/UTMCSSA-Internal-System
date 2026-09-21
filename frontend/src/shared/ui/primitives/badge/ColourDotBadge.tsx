import type { ReactNode } from 'react'
import { composeClassNames } from '@/shared/ui/styling/composeClassNames'

export interface ColourDotBadgeProps {
  /** Hexadecimal colour owned by the entity, for example a department accent. */
  colour: string
  className?: string
  children: ReactNode
}

/**
 * Carries an entity's own colour as a small dot rather than tinting the whole chip, which keeps a
 * table of nine departments readable instead of turning it into a colour chart.
 *
 * 以小圆点承载实体自身的颜色，而非为整个标签着色；
 * 这样九个部门同时出现在表格中时仍然易读，不会变成色卡。
 */
export function ColourDotBadge({ colour, className, children }: ColourDotBadgeProps) {
  return (
    <span
      className={composeClassNames(
        'inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-xs text-neutral-700 whitespace-nowrap',
        className,
      )}
    >
      <span
        aria-hidden
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: colour }}
      />
      {children}
    </span>
  )
}

import type { ReactNode } from 'react'
import {
  badgeBaseClassName,
  badgeToneClassNames,
  type BadgeTone,
} from '@/shared/ui/primitives/badge/badgeStyles'
import { composeClassNames } from '@/shared/ui/styling/composeClassNames'

export interface BadgeProps {
  tone?: BadgeTone
  className?: string
  children: ReactNode
}

export function Badge({ tone = 'neutral', className, children }: BadgeProps) {
  return (
    <span className={composeClassNames(badgeBaseClassName, badgeToneClassNames[tone], className)}>
      {children}
    </span>
  )
}

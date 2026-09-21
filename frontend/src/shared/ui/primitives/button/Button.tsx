import type { ButtonHTMLAttributes, ReactNode } from 'react'
import {
  buttonBaseClassName,
  buttonSizeClassNames,
  buttonVariantClassNames,
  type ButtonSize,
  type ButtonVariant,
} from '@/shared/ui/primitives/button/buttonStyles'
import { composeClassNames } from '@/shared/ui/styling/composeClassNames'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Replaces the label with a waiting state and blocks repeat submissions. */
  isBusy?: boolean
  busyLabel?: ReactNode
}

export function Button({
  variant = 'secondary',
  size = 'medium',
  isBusy = false,
  busyLabel = '处理中…',
  className,
  children,
  disabled,
  type = 'button',
  ...nativeProps
}: ButtonProps) {
  return (
    <button
      {...nativeProps}
      type={type}
      disabled={disabled === true || isBusy}
      aria-busy={isBusy}
      className={composeClassNames(
        buttonBaseClassName,
        buttonVariantClassNames[variant],
        buttonSizeClassNames[size],
        className,
      )}
    >
      {isBusy ? busyLabel : children}
    </button>
  )
}

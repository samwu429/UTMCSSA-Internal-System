import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { FieldShell } from '@/shared/ui/primitives/field/FieldShell'
import {
  fieldControlClassName,
  fieldControlInvalidClassName,
} from '@/shared/ui/primitives/field/fieldStyles'
import { composeClassNames } from '@/shared/ui/styling/composeClassNames'

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> {
  label: string
  hint?: ReactNode
  errorMessage?: string | null
  containerClassName?: string
}

export function TextField({
  label,
  hint,
  errorMessage,
  containerClassName,
  required,
  type = 'text',
  ...nativeProps
}: TextFieldProps) {
  const controlId = useId()

  return (
    <FieldShell
      controlId={controlId}
      label={label}
      hint={hint}
      errorMessage={errorMessage}
      isRequired={required === true}
      className={containerClassName}
    >
      <input
        {...nativeProps}
        id={controlId}
        type={type}
        required={required}
        aria-invalid={errorMessage != null}
        aria-describedby={
          [hint !== undefined ? `${controlId}-hint` : null, errorMessage != null ? `${controlId}-error` : null]
            .filter((value): value is string => value !== null)
            .join(' ') || undefined
        }
        className={composeClassNames(
          fieldControlClassName,
          errorMessage != null && fieldControlInvalidClassName,
        )}
      />
    </FieldShell>
  )
}

import { useId, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { FieldShell } from '@/shared/ui/primitives/field/FieldShell'
import {
  fieldControlClassName,
  fieldControlInvalidClassName,
} from '@/shared/ui/primitives/field/fieldStyles'
import { composeClassNames } from '@/shared/ui/styling/composeClassNames'

export interface TextAreaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'className'> {
  label: string
  hint?: ReactNode
  errorMessage?: string | null
  containerClassName?: string
}

export function TextAreaField({
  label,
  hint,
  errorMessage,
  containerClassName,
  required,
  rows = 4,
  ...nativeProps
}: TextAreaFieldProps) {
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
      <textarea
        {...nativeProps}
        id={controlId}
        rows={rows}
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

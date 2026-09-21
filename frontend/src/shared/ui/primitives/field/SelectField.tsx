import { useId, type ReactNode, type SelectHTMLAttributes } from 'react'
import { FieldShell } from '@/shared/ui/primitives/field/FieldShell'
import {
  fieldControlClassName,
  fieldControlInvalidClassName,
} from '@/shared/ui/primitives/field/fieldStyles'
import { composeClassNames } from '@/shared/ui/styling/composeClassNames'

export interface SelectFieldOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectFieldProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'className' | 'children'> {
  label: string
  options: readonly SelectFieldOption[]
  /** Leading option shown when no value is chosen; omit to force an explicit selection. */
  placeholderLabel?: string
  hint?: ReactNode
  errorMessage?: string | null
  containerClassName?: string
}

export function SelectField({
  label,
  options,
  placeholderLabel,
  hint,
  errorMessage,
  containerClassName,
  required,
  ...nativeProps
}: SelectFieldProps) {
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
      <select
        {...nativeProps}
        id={controlId}
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
      >
        {placeholderLabel !== undefined ? <option value="">{placeholderLabel}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}

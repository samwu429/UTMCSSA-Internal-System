import type { ReactNode } from 'react'
import {
  fieldErrorClassName,
  fieldHintClassName,
  fieldLabelClassName,
} from '@/shared/ui/primitives/field/fieldStyles'
import { composeClassNames } from '@/shared/ui/styling/composeClassNames'

export interface FieldShellProps {
  controlId: string
  label: string
  hint?: ReactNode
  errorMessage?: string | null
  isRequired?: boolean
  className?: string
  children: ReactNode
}

/**
 * The label, hint, and error arrangement every form control shares.
 *
 * Centralizing it is what guarantees each control keeps a real `<label>` bound by id and announces
 * its own error text, instead of relying on placeholders.
 *
 * 所有表单控件共用的标签、提示与错误布局。集中实现可确保每个控件都拥有通过 id 绑定的真实 label
 * 并朗读自身的错误文案，而非依赖占位符表意。
 */
export function FieldShell({
  controlId,
  label,
  hint,
  errorMessage,
  isRequired = false,
  className,
  children,
}: FieldShellProps) {
  const hintId = `${controlId}-hint`
  const errorId = `${controlId}-error`

  return (
    <div className={composeClassNames('w-full', className)}>
      <label htmlFor={controlId} className={fieldLabelClassName}>
        {label}
        {isRequired ? <span className="ml-1 text-[var(--danger)]">*</span> : null}
      </label>
      {children}
      {hint !== undefined ? (
        <div id={hintId} className={fieldHintClassName}>
          {hint}
        </div>
      ) : null}
      {errorMessage != null ? (
        <p id={errorId} className={fieldErrorClassName} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}

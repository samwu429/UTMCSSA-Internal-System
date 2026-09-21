import { useId, type ReactNode } from 'react'
import { composeClassNames } from '@/shared/ui/styling/composeClassNames'

export interface ToggleFieldProps {
  label: string
  description?: ReactNode
  checked: boolean
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
}

/**
 * A switch backed by a real checkbox input, so it stays keyboard-operable and announced correctly
 * while presenting as an on/off control.
 *
 * 以真实 checkbox 承载的开关控件：外观为开/关样式，但保留键盘操作与正确的无障碍语义。
 */
export function ToggleField({
  label,
  description,
  checked,
  disabled = false,
  onCheckedChange,
}: ToggleFieldProps) {
  const controlId = useId()
  const descriptionId = `${controlId}-description`

  return (
    <div className="flex items-start justify-between gap-6 py-3">
      <div className="min-w-0">
        <label htmlFor={controlId} className="block text-[13px] font-medium text-[var(--ink)]">
          {label}
        </label>
        {description !== undefined ? (
          <p id={descriptionId} className="mt-1 text-xs text-[var(--ink-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      <span
        className={composeClassNames(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
          checked ? 'bg-[var(--brand)]' : 'bg-[#c5cad3]',
          disabled && 'opacity-50',
        )}
      >
        <input
          id={controlId}
          type="checkbox"
          role="switch"
          checked={checked}
          aria-checked={checked}
          disabled={disabled}
          aria-describedby={description !== undefined ? descriptionId : undefined}
          onChange={(event) => {
            onCheckedChange(event.target.checked)
          }}
          className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <span
          aria-hidden
          className={composeClassNames(
            'pointer-events-none ml-0.5 size-5 rounded-full bg-white transition-transform',
            checked && 'translate-x-5',
          )}
        />
      </span>
    </div>
  )
}

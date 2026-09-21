import { useId, type SelectHTMLAttributes } from 'react'

export interface ToolbarSelectOption {
  value: string
  label: string
}

export interface ToolbarSelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'className' | 'children'> {
  label: string
  options: readonly ToolbarSelectOption[]
}

export function ToolbarSelect({ label, options, ...nativeProps }: ToolbarSelectProps) {
  const controlId = useId()

  return (
    <label htmlFor={controlId} className="flex items-center gap-1.5 text-[12px] text-[var(--ink-muted)]">
      <span>{label}</span>
      <select
        {...nativeProps}
        id={controlId}
        className="h-7 min-w-28 border border-[var(--line-strong)] bg-white px-1.5 text-[12px] text-[var(--ink)] focus:border-[var(--brand)] focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

export interface CheckboxFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type' | 'className'> {
  label: string
  description?: ReactNode
}

export function CheckboxField({ label, description, ...nativeProps }: CheckboxFieldProps) {
  const controlId = useId()
  const descriptionId = `${controlId}-description`

  return (
    <div className="flex items-start gap-3">
      <input
        {...nativeProps}
        id={controlId}
        type="checkbox"
        aria-describedby={description !== undefined ? descriptionId : undefined}
        className="mt-0.5 size-4 shrink-0 rounded border-neutral-400 accent-[var(--portal-accent)]"
      />
      <div className="min-w-0">
        <label htmlFor={controlId} className="block text-sm text-neutral-900">
          {label}
        </label>
        {description !== undefined ? (
          <p id={descriptionId} className="mt-0.5 text-xs text-neutral-500">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  )
}

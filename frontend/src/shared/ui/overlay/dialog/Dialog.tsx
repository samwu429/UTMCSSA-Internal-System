import { useId, type ReactNode } from 'react'
import { useNativeDialog } from '@/shared/ui/overlay/nativeDialog/useNativeDialog'
import { Button } from '@/shared/ui/primitives/button/Button'

export interface DialogProps {
  isOpen: boolean
  title: string
  description?: ReactNode
  footer?: ReactNode
  widthClassName?: string
  onDismiss: () => void
  children: ReactNode
}

export function Dialog({
  isOpen,
  title,
  description,
  footer,
  widthClassName = 'max-w-2xl',
  onDismiss,
  children,
}: DialogProps) {
  const dialogRef = useNativeDialog(isOpen, onDismiss)
  const titleId = useId()

  return (
    <dialog ref={dialogRef} aria-labelledby={titleId} className="m-auto w-full px-4">
      <div
        className={`mx-auto w-full ${widthClassName} rounded-[var(--radius)] border border-[var(--line)] bg-white`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-4 py-3">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[13px] font-semibold text-[var(--ink)]">
              {title}
            </h2>
            {description !== undefined ? (
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">{description}</p>
            ) : null}
          </div>
          <Button variant="ghost" size="small" onClick={onDismiss} aria-label="关闭对话框">
            关闭
          </Button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto px-4 py-3">{children}</div>
        {footer !== undefined ? (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--line)] px-4 py-2.5">
            {footer}
          </footer>
        ) : null}
      </div>
    </dialog>
  )
}

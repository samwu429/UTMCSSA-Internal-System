import { useId, type ReactNode } from 'react'
import { useNativeDialog } from '@/shared/ui/overlay/nativeDialog/useNativeDialog'
import { Button } from '@/shared/ui/primitives/button/Button'

export interface DialogProps {
  isOpen: boolean
  title: string
  description?: ReactNode
  /** Footer controls; the dialog supplies no default confirm button. */
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
        className={`mx-auto w-full ${widthClassName} rounded-lg border border-neutral-200 bg-white shadow-lg`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-neutral-900">
              {title}
            </h2>
            {description !== undefined ? (
              <p className="mt-1 text-sm text-neutral-500">{description}</p>
            ) : null}
          </div>
          <Button variant="ghost" size="small" onClick={onDismiss} aria-label="关闭对话框">
            关闭
          </Button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer !== undefined ? (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-neutral-200 px-5 py-3">
            {footer}
          </footer>
        ) : null}
      </div>
    </dialog>
  )
}

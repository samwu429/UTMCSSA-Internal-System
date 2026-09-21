import { useId, type ReactNode } from 'react'
import { useNativeDialog } from '@/shared/ui/overlay/nativeDialog/useNativeDialog'
import { Button } from '@/shared/ui/primitives/button/Button'

export interface SideDrawerProps {
  isOpen: boolean
  title: string
  description?: ReactNode
  onDismiss: () => void
  children: ReactNode
}

export function SideDrawer({
  isOpen,
  title,
  description,
  onDismiss,
  children,
}: SideDrawerProps) {
  const dialogRef = useNativeDialog(isOpen, onDismiss)
  const titleId = useId()

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="ml-auto h-full max-h-none w-full max-w-md"
    >
      <div className="flex h-full flex-col border-l border-[var(--line)] bg-white">
        <header className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-4 py-3">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[13px] font-semibold text-[var(--ink)]">
              {title}
            </h2>
            {description !== undefined ? (
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">{description}</p>
            ) : null}
          </div>
          <Button variant="ghost" size="small" onClick={onDismiss} aria-label="关闭面板">
            关闭
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-3">{children}</div>
      </div>
    </dialog>
  )
}

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

/**
 * A modal panel anchored to the trailing edge, used where a record's history should stay beside
 * the list it belongs to instead of replacing it.
 *
 * 贴靠右侧的模态面板，用于在不离开列表的情况下查看某条记录的历史。
 */
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
      <div className="flex h-full flex-col border-l border-neutral-200 bg-white">
        <header className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-neutral-900">
              {title}
            </h2>
            {description !== undefined ? (
              <p className="mt-1 text-sm text-neutral-500">{description}</p>
            ) : null}
          </div>
          <Button variant="ghost" size="small" onClick={onDismiss} aria-label="关闭面板">
            关闭
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </dialog>
  )
}

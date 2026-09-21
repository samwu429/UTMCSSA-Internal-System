import type { ToastMessage, ToastTone } from '@/app/providers/notifications/toastTypes'
import { composeClassNames } from '@/shared/ui/styling/composeClassNames'

const toneClassNames: Record<ToastTone, string> = {
  informational: 'border-[var(--line-strong)] bg-white text-[var(--ink)]',
  success: 'border-[#9dcdc0] bg-[#eef6f3] text-[#0f6b4c]',
  failure: 'border-[#e2b4ae] bg-[var(--danger-soft)] text-[var(--danger)]',
}

export interface ToastViewportProps {
  messages: readonly ToastMessage[]
  onDismiss: (id: string) => void
}

export function ToastViewport({ messages, onDismiss }: ToastViewportProps) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end"
    >
      {messages.map((message) => (
        <div
          key={message.id}
          role={message.tone === 'failure' ? 'alert' : 'status'}
          className={composeClassNames(
            'pointer-events-auto flex w-full max-w-sm items-start justify-between gap-4 border px-3 py-2.5',
            toneClassNames[message.tone],
          )}
        >
          <p className="text-[13px] break-words">{message.text}</p>
          <button
            type="button"
            onClick={() => {
              onDismiss(message.id)
            }}
            className="shrink-0 text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]"
          >
            关闭
          </button>
        </div>
      ))}
    </div>
  )
}

import type { ToastMessage, ToastTone } from '@/app/providers/notifications/toastTypes'
import { composeClassNames } from '@/shared/ui/styling/composeClassNames'

const toneClassNames: Record<ToastTone, string> = {
  informational: 'border-neutral-300 bg-white text-neutral-800',
  success: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  failure: 'border-red-300 bg-red-50 text-red-900',
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
            'pointer-events-auto flex w-full max-w-md items-start justify-between gap-4 rounded-md border px-4 py-3 shadow-sm',
            toneClassNames[message.tone],
          )}
        >
          <p className="text-sm break-words">{message.text}</p>
          <button
            type="button"
            onClick={() => {
              onDismiss(message.id)
            }}
            className="shrink-0 text-xs text-neutral-500 hover:text-neutral-800"
          >
            关闭
          </button>
        </div>
      ))}
    </div>
  )
}

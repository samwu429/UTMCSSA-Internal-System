import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToastContext } from '@/app/providers/notifications/toastContext'
import { ToastViewport } from '@/app/providers/notifications/ToastViewport'
import type {
  ToastController,
  ToastMessage,
  ToastTone,
} from '@/app/providers/notifications/toastTypes'
import { resolveErrorMessage } from '@/shared/api/client/errors/resolveErrorMessage'

const TOAST_LIFETIME_MILLISECONDS = 6000
const MAXIMUM_VISIBLE_TOASTS = 4

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<readonly ToastMessage[]>([])
  const nextIdentifier = useRef(0)

  const dismiss = useCallback((id: string) => {
    setMessages((current) => current.filter((message) => message.id !== id))
  }, [])

  const push = useCallback(
    (tone: ToastTone, text: string) => {
      nextIdentifier.current += 1
      const id = `toast-${nextIdentifier.current}`
      setMessages((current) => [...current, { id, tone, text }].slice(-MAXIMUM_VISIBLE_TOASTS))
      window.setTimeout(() => {
        dismiss(id)
      }, TOAST_LIFETIME_MILLISECONDS)
    },
    [dismiss],
  )

  const controller = useMemo<ToastController>(
    () => ({
      showInformation: (text) => {
        push('informational', text)
      },
      showSuccess: (text) => {
        push('success', text)
      },
      showFailure: (text) => {
        push('failure', text)
      },
      showRequestFailure: (error) => {
        push('failure', resolveErrorMessage(error))
      },
      dismiss,
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={controller}>
      {children}
      <ToastViewport messages={messages} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

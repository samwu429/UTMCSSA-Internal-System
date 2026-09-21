import { useContext } from 'react'
import { ToastContext } from '@/app/providers/notifications/toastContext'
import type { ToastController } from '@/app/providers/notifications/toastTypes'

export function useToastController(): ToastController {
  const controller = useContext(ToastContext)
  if (controller === null) {
    throw new Error('useToastController must be used inside ToastProvider.')
  }
  return controller
}

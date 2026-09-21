import { createContext } from 'react'
import type { ToastController } from '@/app/providers/notifications/toastTypes'

export const ToastContext = createContext<ToastController | null>(null)

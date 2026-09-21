export type ToastTone = 'informational' | 'success' | 'failure'

export interface ToastMessage {
  id: string
  tone: ToastTone
  text: string
}

export interface ToastController {
  showInformation: (text: string) => void
  showSuccess: (text: string) => void
  showFailure: (text: string) => void
  /** Surfaces the backend's Chinese explanation for a rejected request. */
  showRequestFailure: (error: unknown) => void
  dismiss: (id: string) => void
}

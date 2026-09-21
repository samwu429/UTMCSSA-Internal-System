import { useEffect, useRef } from 'react'

/**
 * Drives a native `<dialog>` from a boolean.
 *
 * The platform element is used deliberately: it supplies the focus trap, the inert background, and
 * dismissal on Escape that a hand-rolled overlay would have to reimplement and usually gets wrong.
 *
 * 以布尔值驱动原生 dialog 元素。选择原生元素是有意为之：
 * 焦点约束、背景惰性化与 Escape 关闭均由平台提供，自行实现的浮层往往在这些细节上出错。
 */
export function useNativeDialog(isOpen: boolean, onDismiss: () => void) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog === null) {
      return
    }

    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog === null) {
      return
    }

    // `close` fires for the Escape key as well as for programmatic closing, so the parent state
    // is reconciled here rather than in a separate key handler.
    // close 事件同时覆盖 Escape 关闭与程序关闭，因此在此统一同步父级状态，无需另设按键处理。
    const handleClose = () => {
      onDismiss()
    }
    dialog.addEventListener('close', handleClose)
    return () => {
      dialog.removeEventListener('close', handleClose)
    }
  }, [onDismiss])

  return dialogRef
}

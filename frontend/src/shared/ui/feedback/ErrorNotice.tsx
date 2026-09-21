import { resolveErrorMessage } from '@/shared/api/client/errors/resolveErrorMessage'
import { Button } from '@/shared/ui/primitives/button/Button'

export interface ErrorNoticeProps {
  error: unknown
  onRetry?: () => void
}

export function ErrorNotice({ error, onRetry }: ErrorNoticeProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center" role="alert">
      <p className="text-sm text-neutral-800">{resolveErrorMessage(error)}</p>
      {onRetry !== undefined ? (
        <Button size="small" onClick={onRetry}>
          重新加载
        </Button>
      ) : null}
    </div>
  )
}

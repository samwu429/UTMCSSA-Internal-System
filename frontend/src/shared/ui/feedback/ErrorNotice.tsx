import { resolveErrorMessage } from '@/shared/api/client/errors/resolveErrorMessage'
import { Button } from '@/shared/ui/primitives/button/Button'

export interface ErrorNoticeProps {
  error: unknown
  onRetry?: () => void
}

export function ErrorNotice({ error, onRetry }: ErrorNoticeProps) {
  return (
    <div className="flex flex-col items-start gap-2 py-6" role="alert">
      <p className="text-[13px] text-[var(--ink)]">{resolveErrorMessage(error)}</p>
      {onRetry !== undefined ? (
        <Button size="small" onClick={onRetry}>
          重试
        </Button>
      ) : null}
    </div>
  )
}

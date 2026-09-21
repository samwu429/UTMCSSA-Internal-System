import type { ReactNode } from 'react'
import { ErrorNotice } from '@/shared/ui/feedback/ErrorNotice'
import { LoadingPanel } from '@/shared/ui/feedback/LoadingPanel'

export interface QueryStateBoundaryProps<TData> {
  isPending: boolean
  error: unknown
  data: TData | undefined
  onRetry?: () => void
  loadingLabel?: string
  children: (data: TData) => ReactNode
}

/**
 * Renders the loading, failed, and ready states of one query in a consistent order, so each screen
 * describes only its ready state.
 *
 * 以统一顺序处理单个查询的加载、失败与就绪状态，使各页面只需描述就绪状态。
 */
export function QueryStateBoundary<TData>({
  isPending,
  error,
  data,
  onRetry,
  loadingLabel,
  children,
}: QueryStateBoundaryProps<TData>) {
  if (error != null) {
    return <ErrorNotice error={error} onRetry={onRetry} />
  }
  if (isPending || data === undefined) {
    return <LoadingPanel label={loadingLabel} />
  }
  return <>{children(data)}</>
}

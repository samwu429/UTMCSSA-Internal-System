import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import type { ToastController } from '@/app/providers/notifications/toastTypes'
import { ApiRequestError } from '@/shared/api/client/errors/ApiRequestError'

const STALE_TIME_MILLISECONDS = 30_000
const MAXIMUM_RETRY_ATTEMPTS = 2

/**
 * A failure the member cannot act on: the session has already been cleared and the guard is about
 * to route to sign-in, so a toast would only add noise to that transition.
 *
 * 成员无法据此采取行动的失败：会话已被清除且路由守卫即将跳转登录页，
 * 此时再弹出提示只会干扰该过程。
 */
function isSilentFailure(error: unknown): boolean {
  return error instanceof ApiRequestError && (error.status === 401 || error.status === 403)
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiRequestError && error.status >= 400 && error.status < 500) {
    return false
  }
  return failureCount < MAXIMUM_RETRY_ATTEMPTS
}

/**
 * Failed reads and writes surface through one toast channel, so no screen has to remember to
 * report a backend rejection.
 *
 * 读写失败统一经由一个提示通道呈现，各页面无需各自记得上报后端拒绝。
 */
export function createQueryClient(toasts: ToastController): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (!isSilentFailure(error)) {
          toasts.showRequestFailure(error)
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        if (!isSilentFailure(error)) {
          toasts.showRequestFailure(error)
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MILLISECONDS,
        refetchOnWindowFocus: false,
        retry: shouldRetry,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

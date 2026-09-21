type SessionExpiryListener = () => void

const listeners = new Set<SessionExpiryListener>()

/**
 * Lets the transport layer announce an unrecoverable session loss without importing the router.
 *
 * The fetch wrapper cannot navigate on its own, and giving it a router reference would make the
 * routing tree a dependency of every API call. A listener inverts that direction.
 *
 * 使传输层能在无法恢复会话时发出通知，而不必引入路由。若让 fetch 封装直接持有路由引用，
 * 路由树将成为所有 API 调用的依赖；以监听者模式反转该依赖方向。
 */
export function subscribeToSessionExpiry(listener: SessionExpiryListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function notifySessionExpired(): void {
  for (const listener of listeners) {
    listener()
  }
}

import { useCallback, useEffect, useState } from 'react'

export interface SecondsCountdown {
  remainingSeconds: number
  isRunning: boolean
  restart: (seconds: number) => void
}

/**
 * A one-second ticker used for resend cooldowns, stopping at zero rather than going negative.
 *
 * 以秒为步长的倒计时，用于重发冷却；归零后停止，不会继续递减为负值。
 */
export function useSecondsCountdown(initialSeconds = 0): SecondsCountdown {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds)

  useEffect(() => {
    if (remainingSeconds <= 0) {
      return
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => (current <= 1 ? 0 : current - 1))
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [remainingSeconds])

  const restart = useCallback((seconds: number) => {
    setRemainingSeconds(Math.max(0, Math.floor(seconds)))
  }, [])

  return { remainingSeconds, isRunning: remainingSeconds > 0, restart }
}

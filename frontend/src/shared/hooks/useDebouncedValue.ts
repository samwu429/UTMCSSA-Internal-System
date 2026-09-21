import { useEffect, useState } from 'react'

/**
 * Holds back a rapidly changing value, used so a search box issues one request per pause rather
 * than one per keystroke.
 *
 * 延迟快速变化的值，使搜索框在停顿后发起一次请求，而非每次按键都请求。
 */
export function useDebouncedValue<TValue>(value: TValue, delayMilliseconds = 300): TValue {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value)
    }, delayMilliseconds)

    return () => {
      window.clearTimeout(timer)
    }
  }, [value, delayMilliseconds])

  return debouncedValue
}

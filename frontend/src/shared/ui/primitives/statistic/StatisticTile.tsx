import type { ReactNode } from 'react'

export interface StatisticTileProps {
  label: string
  value: ReactNode
  caption?: string
}

export function StatisticTile({ label, value, caption }: StatisticTileProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3.5">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--portal-accent-strong)]">
        {value}
      </p>
      {caption !== undefined ? <p className="mt-1 text-xs text-neutral-400">{caption}</p> : null}
    </div>
  )
}

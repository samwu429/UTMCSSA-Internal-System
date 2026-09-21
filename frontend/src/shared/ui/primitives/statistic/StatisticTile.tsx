import type { ReactNode } from 'react'

export interface StatisticTileProps {
  label: string
  value: ReactNode
  caption?: string
}

export function StatisticTile({ label, value, caption }: StatisticTileProps) {
  return (
    <div className="bg-[var(--surface)] px-3 py-2.5">
      <p className="text-[11px] text-[var(--ink-muted)]">{label}</p>
      <p className="mt-1 font-mono text-[22px] font-medium tabular-nums tracking-tight text-[var(--ink)]">
        {value}
      </p>
      {caption !== undefined ? (
        <p className="mt-0.5 text-[11px] text-[var(--ink-faint)]">{caption}</p>
      ) : null}
    </div>
  )
}

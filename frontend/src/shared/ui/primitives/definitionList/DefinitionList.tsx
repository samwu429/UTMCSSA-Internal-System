import type { ReactNode } from 'react'

export interface DefinitionListEntry {
  term: string
  description: ReactNode
}

export interface DefinitionListProps {
  entries: readonly DefinitionListEntry[]
  columnsClassName?: string
}

export function DefinitionList({
  entries,
  columnsClassName = 'sm:grid-cols-2',
}: DefinitionListProps) {
  return (
    <dl className={`grid grid-cols-1 gap-x-6 gap-y-4 ${columnsClassName}`}>
      {entries.map((entry) => (
        <div key={entry.term} className="min-w-0">
          <dt className="text-xs text-[var(--ink-muted)]">{entry.term}</dt>
          <dd className="mt-0.5 text-[13px] break-words text-[var(--ink)]">{entry.description}</dd>
        </div>
      ))}
    </dl>
  )
}

import { composeClassNames } from '@/shared/ui/styling/composeClassNames'

export interface SegmentedNavigationItem {
  id: string
  label: string
  badgeCount?: number
}

export interface SegmentedNavigationProps {
  label: string
  items: readonly SegmentedNavigationItem[]
  activeItemId: string
  onSelect: (itemId: string) => void
}

export function SegmentedNavigation({
  label,
  items,
  activeItemId,
  onSelect,
}: SegmentedNavigationProps) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex flex-wrap gap-0 border-b border-[var(--line)]"
    >
      {items.map((item) => {
        const isActive = item.id === activeItemId
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              onSelect(item.id)
            }}
            className={composeClassNames(
              '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-[13px]',
              isActive
                ? 'border-[var(--brand)] font-medium text-[var(--brand)]'
                : 'border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]',
            )}
          >
            {item.label}
            {item.badgeCount !== undefined && item.badgeCount > 0 ? (
              <span className="bg-[var(--brand-soft)] px-1.5 py-px font-mono text-[11px] text-[var(--brand)]">
                {item.badgeCount}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

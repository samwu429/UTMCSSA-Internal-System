import { composeClassNames } from '@/shared/ui/styling/composeClassNames'

export interface SegmentedNavigationItem {
  id: string
  label: string
  /** Rendered as a small count beside the label, for example a pending-approval backlog. */
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
      className="flex flex-wrap gap-1 border-b border-neutral-200"
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
              '-mb-px flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm transition-colors',
              isActive
                ? 'border-[var(--portal-accent)] font-medium text-[var(--portal-accent-strong)]'
                : 'border-transparent text-neutral-600 hover:text-neutral-900',
            )}
          >
            {item.label}
            {item.badgeCount !== undefined && item.badgeCount > 0 ? (
              <span className="rounded-full bg-[var(--portal-accent-soft)] px-1.5 py-0.5 text-xs text-[var(--portal-accent-strong)]">
                {item.badgeCount}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export type BadgeTone = 'neutral' | 'accent' | 'positive' | 'caution' | 'critical'

export const badgeBaseClassName =
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs whitespace-nowrap'

export const badgeToneClassNames: Record<BadgeTone, string> = {
  neutral: 'border-neutral-300 bg-neutral-50 text-neutral-700',
  accent:
    'border-[var(--portal-accent-border)] bg-[var(--portal-accent-soft)] ' +
    'text-[var(--portal-accent-strong)]',
  positive: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  caution: 'border-amber-300 bg-amber-50 text-amber-800',
  critical: 'border-red-300 bg-red-50 text-red-800',
}

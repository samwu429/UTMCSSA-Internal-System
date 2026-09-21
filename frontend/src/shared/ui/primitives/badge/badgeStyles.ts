export type BadgeTone = 'neutral' | 'accent' | 'positive' | 'caution' | 'critical'

export const badgeBaseClassName =
  'inline-flex items-center gap-1 rounded-[var(--radius)] border px-1.5 py-px text-[11px] whitespace-nowrap'

export const badgeToneClassNames: Record<BadgeTone, string> = {
  neutral: 'border-[var(--line)] bg-[var(--paper)] text-[var(--ink-muted)]',
  accent: 'border-[#b7c4d4] bg-[var(--brand-soft)] text-[var(--brand)]',
  positive: 'border-[#9dcdc0] bg-[#eef6f3] text-[#0f6b4c]',
  caution: 'border-[#e4c88a] bg-[#f8f1df] text-[#8a5a12]',
  critical: 'border-[#e2b4ae] bg-[var(--danger-soft)] text-[var(--danger)]',
}

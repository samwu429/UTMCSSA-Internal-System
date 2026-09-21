export type ButtonVariant = 'primary' | 'secondary' | 'accentSoft' | 'danger' | 'ghost'
export type ButtonSize = 'small' | 'medium' | 'large'

export const buttonBaseClassName =
  'inline-flex items-center justify-center gap-1.5 rounded-[var(--radius)] font-medium ' +
  'transition-colors disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap'

export const buttonVariantClassNames: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]',
  secondary:
    'border border-[var(--line-strong)] bg-white text-[var(--ink)] hover:bg-[var(--paper)]',
  accentSoft: 'border border-[var(--line)] bg-[var(--brand-soft)] text-[var(--brand)] hover:border-[var(--brand)]',
  danger: 'border border-[#e2b4ae] bg-white text-[var(--danger)] hover:bg-[var(--danger-soft)]',
  ghost: 'text-[var(--ink-muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]',
}

export const buttonSizeClassNames: Record<ButtonSize, string> = {
  small: 'h-7 px-2.5 text-xs',
  medium: 'h-8 px-3 text-[13px]',
  large: 'h-9 px-4 text-[13px]',
}

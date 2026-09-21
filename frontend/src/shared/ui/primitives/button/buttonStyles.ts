export type ButtonVariant = 'primary' | 'secondary' | 'accentSoft' | 'danger' | 'ghost'
export type ButtonSize = 'small' | 'medium' | 'large'

export const buttonBaseClassName =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors ' +
  'disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap'

export const buttonVariantClassNames: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--portal-accent)] text-[var(--portal-accent-contrast)] ' +
    'hover:bg-[var(--portal-accent-strong)]',
  secondary: 'border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50',
  accentSoft:
    'border border-[var(--portal-accent-border)] bg-[var(--portal-accent-soft)] ' +
    'text-[var(--portal-accent-strong)] hover:border-[var(--portal-accent)]',
  danger: 'border border-red-300 bg-white text-red-700 hover:bg-red-50',
  ghost: 'text-neutral-700 hover:bg-neutral-100',
}

export const buttonSizeClassNames: Record<ButtonSize, string> = {
  small: 'h-8 px-3 text-xs',
  medium: 'h-10 px-4 text-sm',
  large: 'h-11 px-6 text-sm',
}

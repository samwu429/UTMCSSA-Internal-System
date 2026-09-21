export interface LoadingPanelProps {
  label?: string
}

export function LoadingPanel({ label = '正在加载…' }: LoadingPanelProps) {
  return (
    <div className="flex items-center gap-2 py-8" role="status">
      <span
        aria-hidden
        className="size-3.5 animate-spin rounded-full border border-[var(--line-strong)] border-t-[var(--brand)]"
      />
      <span className="text-[13px] text-[var(--ink-muted)]">{label}</span>
    </div>
  )
}

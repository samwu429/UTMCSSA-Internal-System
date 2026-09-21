export interface LoadingPanelProps {
  label?: string
}

export function LoadingPanel({ label = '正在加载…' }: LoadingPanelProps) {
  return (
    <div className="flex items-center justify-center gap-3 py-10" role="status">
      <span
        aria-hidden
        className="size-4 animate-spin rounded-full border-2 border-neutral-300 border-t-[var(--portal-accent)]"
      />
      <span className="text-sm text-neutral-500">{label}</span>
    </div>
  )
}

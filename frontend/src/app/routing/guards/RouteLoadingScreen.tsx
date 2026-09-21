import { LoadingPanel } from '@/shared/ui/feedback/LoadingPanel'

export function RouteLoadingScreen({ label }: { label?: string }) {
  return (
    <div className="min-h-screen bg-[var(--paper)] px-6 py-8">
      <LoadingPanel label={label} />
    </div>
  )
}

import { LoadingPanel } from '@/shared/ui/feedback/LoadingPanel'

export function RouteLoadingScreen({ label }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100">
      <LoadingPanel label={label} />
    </div>
  )
}

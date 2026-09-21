import { DocumentVaultPage } from '@/features/documents/vault/pages/DocumentVaultPage'
import { PageHeading } from '@/shared/ui/primitives/surface/PageHeading'
import { Panel } from '@/shared/ui/primitives/surface/Panel'

export function SponsorPipelinePage() {
  return (
    <div className="space-y-4">
      <PageHeading title="赞助" description="沟通记录、协议与履约材料。" />
      <Panel>
        <p className="text-[13px] text-[var(--ink-muted)]">
          建议按「接触中 / 已签约 / 履约中」写标题。
        </p>
      </Panel>
      <DocumentVaultPage hideHeading preferredCategorySlug="planning" />
    </div>
  )
}

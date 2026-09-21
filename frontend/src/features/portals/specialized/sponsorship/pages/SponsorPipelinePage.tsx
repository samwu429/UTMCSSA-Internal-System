import { DocumentVaultPage } from '@/features/documents/vault/pages/DocumentVaultPage'
import { PageHeading } from '@/shared/ui/primitives/surface/PageHeading'
import { Panel } from '@/shared/ui/primitives/surface/Panel'

export function SponsorPipelinePage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="赞助跟进"
        englishTitle="Sponsor pipeline"
        description="把赞助商沟通记录、合作协议和履约材料放在本部分类下。其他部门在后台可以监管，但不会进入这个页面。"
      />
      <Panel title="本页只属于赞助部">
        <p className="text-sm text-neutral-600">
          建议在策划分类中按「接触中 / 已签约 / 履约中」写清标题。文件入库后主席团仍可监管，前端始终是赞助部系统。
        </p>
      </Panel>
      <DocumentVaultPage hideHeading preferredCategorySlug="planning" />
    </div>
  )
}

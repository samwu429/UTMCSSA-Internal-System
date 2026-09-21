import { DocumentVaultPage } from '@/features/documents/vault/pages/DocumentVaultPage'
import { PageHeading } from '@/shared/ui/primitives/surface/PageHeading'
import { Panel } from '@/shared/ui/primitives/surface/Panel'

export function BudgetLedgerPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="预算与报销台账"
        englishTitle="Budget ledger"
        description="财政部专用页面：预算表、报销单和活动结算默认落在「预算与报销」分类。"
      />
      <Panel title="给非技术同事的用法">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-neutral-700">
          <li>确认左侧已打开「预算与报销」。</li>
          <li>上传 Excel 或 PDF，标题写清活动名称和学期。</li>
          <li>需要全社可见的报表，把可见范围改成「全社团可见」。</li>
        </ol>
      </Panel>
      <DocumentVaultPage hideHeading preferredCategorySlug="finance" />
    </div>
  )
}

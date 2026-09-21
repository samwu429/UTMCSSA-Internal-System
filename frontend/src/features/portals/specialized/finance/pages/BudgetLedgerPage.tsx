import { DocumentVaultPage } from '@/features/documents/vault/pages/DocumentVaultPage'
import { PageHeading } from '@/shared/ui/primitives/surface/PageHeading'

export function BudgetLedgerPage() {
  return (
    <div className="space-y-4">
      <PageHeading title="预算" description="预算表、报销单与活动结算。" />
      <DocumentVaultPage hideHeading preferredCategorySlug="finance" />
    </div>
  )
}

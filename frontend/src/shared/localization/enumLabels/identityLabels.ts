import {
  AccountStatus,
  AffiliationType,
} from '@/shared/api/contracts/identity/accountLifecycle'

export const accountStatusLabels: Record<AccountStatus, string> = {
  [AccountStatus.PENDING_VERIFICATION]: '待邮箱验证',
  [AccountStatus.PENDING_APPROVAL]: '待主席团审批',
  [AccountStatus.ACTIVE]: '正常',
  [AccountStatus.SUSPENDED]: '已停用',
  [AccountStatus.REJECTED]: '已拒绝',
}

export const affiliationLabels: Record<AffiliationType, string> = {
  [AffiliationType.STUDENT]: '在校生',
  [AffiliationType.ALUMNUS]: '毕业生',
}

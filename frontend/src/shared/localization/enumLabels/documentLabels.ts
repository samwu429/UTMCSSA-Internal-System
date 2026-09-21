import {
  DocumentKind,
  DocumentVisibility,
} from '@/shared/api/contracts/documents/documentClassification'

export const documentVisibilityLabels: Record<DocumentVisibility, string> = {
  [DocumentVisibility.DEPARTMENT]: '仅本部门可见',
  [DocumentVisibility.ORGANIZATION]: '全社团可见',
  [DocumentVisibility.PRESIDIUM_ONLY]: '仅主席团可见',
}

export const documentKindLabels: Record<DocumentKind, string> = {
  [DocumentKind.GOVERNANCE]: '治理与行政',
  [DocumentKind.PLANNING]: '活动策划',
  [DocumentKind.FINANCE]: '财务',
  [DocumentKind.SPONSORSHIP]: '赞助',
  [DocumentKind.PUBLICITY]: '宣传',
  [DocumentKind.ACADEMIC]: '学术',
  [DocumentKind.ARCHIVE]: '归档',
}

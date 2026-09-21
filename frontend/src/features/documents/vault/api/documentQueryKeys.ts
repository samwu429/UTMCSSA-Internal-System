import type { DocumentQuery } from '@/shared/api/contracts/documents/vault'

export const documentQueryKeys = {
  root: ['documents'] as const,
  page: (query: DocumentQuery) => [...documentQueryKeys.root, 'page', query] as const,
  categories: (departmentId?: string) =>
    [...documentQueryKeys.root, 'categories', departmentId ?? 'all'] as const,
}

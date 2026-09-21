import type { MemberDirectoryQuery } from '@/shared/api/contracts/directory/member'

export const memberQueryKeys = {
  root: ['members'] as const,
  page: (query: MemberDirectoryQuery) => [...memberQueryKeys.root, 'page', query] as const,
}

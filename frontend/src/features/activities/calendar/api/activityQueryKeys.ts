import type { ActivityQuery } from '@/shared/api/contracts/activities/activity'

export const activityQueryKeys = {
  root: ['activities'] as const,
  list: (query: ActivityQuery) => [...activityQueryKeys.root, 'list', query] as const,
  announcements: (departmentId?: string) =>
    [...activityQueryKeys.root, 'announcements', departmentId ?? 'all'] as const,
}

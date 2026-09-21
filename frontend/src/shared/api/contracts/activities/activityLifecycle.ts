export const ActivityStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const

export type ActivityStatus = (typeof ActivityStatus)[keyof typeof ActivityStatus]

/** Who the activity is announced to once published. */
export const ActivityAudience = {
  DEPARTMENT: 'department',
  ALL_MEMBERS: 'all_members',
  ALUMNI: 'alumni',
  PUBLIC: 'public',
} as const

export type ActivityAudience = (typeof ActivityAudience)[keyof typeof ActivityAudience]

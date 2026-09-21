import {
  ActivityAudience,
  ActivityStatus,
} from '@/shared/api/contracts/activities/activityLifecycle'

export const activityStatusLabels: Record<ActivityStatus, string> = {
  [ActivityStatus.DRAFT]: '草稿',
  [ActivityStatus.PUBLISHED]: '已发布',
  [ActivityStatus.CANCELLED]: '已取消',
  [ActivityStatus.COMPLETED]: '已结束',
}

export const activityAudienceLabels: Record<ActivityAudience, string> = {
  [ActivityAudience.DEPARTMENT]: '本部门',
  [ActivityAudience.ALL_MEMBERS]: '全体成员',
  [ActivityAudience.ALUMNI]: '毕业生校友',
  [ActivityAudience.PUBLIC]: '公开',
}

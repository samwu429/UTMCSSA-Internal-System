import {
  EmailDeliveryStatus,
  EmailTemplateKey,
} from '@/shared/api/contracts/notifications/emailDelivery'

export const emailDeliveryStatusLabels: Record<EmailDeliveryStatus, string> = {
  [EmailDeliveryStatus.QUEUED]: '排队中',
  [EmailDeliveryStatus.SENT]: '已发送',
  [EmailDeliveryStatus.FAILED]: '发送失败',
  [EmailDeliveryStatus.SKIPPED]: '已跳过',
}

export const emailTemplateLabels: Record<EmailTemplateKey, string> = {
  [EmailTemplateKey.VERIFICATION_CODE]: '邮箱验证码',
  [EmailTemplateKey.PASSWORD_RESET_CODE]: '密码重置验证码',
  [EmailTemplateKey.REGISTRATION_APPROVED]: '注册通过通知',
  [EmailTemplateKey.REGISTRATION_REJECTED]: '注册拒绝通知',
  [EmailTemplateKey.ACTIVITY_ANNOUNCEMENT]: '活动公告',
  [EmailTemplateKey.DEPARTMENT_BROADCAST]: '部门群发邮件',
  [EmailTemplateKey.DAILY_DIGEST]: '每日摘要',
}

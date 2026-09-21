import type { CourseScheduleEntry } from '@/shared/api/contracts/academics/course'
import type {
  IsoDateString,
  IsoDateTimeString,
  UuidString,
} from '@/shared/api/contracts/common/scalarTypes'
import type {
  EmailDeliveryStatus,
  EmailTemplateKey,
} from '@/shared/api/contracts/notifications/emailDelivery'

/**
 * Leaving `department_id` empty targets the whole association, which the backend authorizes with
 * the organization-wide send permission rather than the department one.
 *
 * department_id 为空表示面向全社团，后端据此要求组织级发送权限而非部门级权限。
 */
export interface BroadcastRequest {
  subject: string
  body: string
  department_id?: UuidString | null
  include_alumni: boolean
  preview_only: boolean
}

export interface BroadcastResult {
  recipient_count: number
  sent_count: number
  skipped_count: number
  failed_count: number
  preview_recipients: string[]
}

export interface DailyDigestWeather {
  condition_en: string
  condition_zh: string
  temperature_high_celsius?: number | null
  temperature_low_celsius?: number | null
  precipitation_probability_percent?: number | null
  sunrise?: string | null
  sunset?: string | null
}

export interface DailyDigestActivity {
  title: string
  department_name_zh?: string | null
  starts_at: IsoDateTimeString
  location?: string | null
}

export interface DailyDigestContent {
  digest_date: IsoDateString
  weekday_en: string
  weekday_zh: string
  recipient_name: string
  weather?: DailyDigestWeather | null
  courses: CourseScheduleEntry[]
  activities: DailyDigestActivity[]
  announcements: string[]
}

export interface EmailDeliveryRecord {
  id: UuidString
  recipient_email: string
  template_key: EmailTemplateKey
  subject: string
  status: EmailDeliveryStatus
  failure_reason?: string | null
  sent_at?: IsoDateTimeString | null
  created_at: IsoDateTimeString
}

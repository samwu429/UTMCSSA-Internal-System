import type {
  ActivityAudience,
  ActivityStatus,
} from '@/shared/api/contracts/activities/activityLifecycle'
import type { IsoDateTimeString, UuidString } from '@/shared/api/contracts/common/scalarTypes'

export interface ActivitySummary {
  id: UuidString
  title: string
  summary?: string | null
  location?: string | null
  department_id: UuidString
  department_slug?: string | null
  department_name_zh?: string | null
  department_accent_color?: string | null
  starts_at: IsoDateTimeString
  ends_at?: IsoDateTimeString | null
  status: ActivityStatus
  audience: ActivityAudience
  cover_image_url?: string | null
}

export interface ActivityDetail extends ActivitySummary {
  description?: string | null
  capacity?: number | null
  registration_url?: string | null
  created_by_id?: UuidString | null
  created_by_name?: string | null
  published_at?: IsoDateTimeString | null
  announced_at?: IsoDateTimeString | null
}

export interface ActivityCreate {
  title: string
  summary?: string | null
  description?: string | null
  location?: string | null
  department_id: UuidString
  starts_at: IsoDateTimeString
  ends_at?: IsoDateTimeString | null
  audience: ActivityAudience
  capacity?: number | null
  registration_url?: string | null
  cover_image_url?: string | null
}

export interface ActivityUpdate {
  title?: string | null
  summary?: string | null
  description?: string | null
  location?: string | null
  starts_at?: IsoDateTimeString | null
  ends_at?: IsoDateTimeString | null
  audience?: ActivityAudience | null
  status?: ActivityStatus | null
  capacity?: number | null
  registration_url?: string | null
  cover_image_url?: string | null
}

/** Publishing is separate from editing because it is what triggers member emails. */
export interface ActivityPublishRequest {
  notify_by_email: boolean
}

export interface ActivityQuery {
  department_id?: UuidString
  starts_after?: IsoDateTimeString
  starts_before?: IsoDateTimeString
  status?: ActivityStatus
}

export interface AnnouncementSummary {
  id: UuidString
  title: string
  body: string
  department_id?: UuidString | null
  department_name_zh?: string | null
  audience: ActivityAudience
  author_id?: UuidString | null
  author_name?: string | null
  published_at?: IsoDateTimeString | null
  is_pinned: boolean
  emailed_at?: IsoDateTimeString | null
}

export interface AnnouncementCreate {
  title: string
  body: string
  department_id?: UuidString | null
  audience: ActivityAudience
  is_pinned: boolean
  send_email: boolean
  publish_now: boolean
}

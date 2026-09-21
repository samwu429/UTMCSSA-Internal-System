import type {
  IsoTimeString,
  UuidString,
} from '@/shared/api/contracts/common/scalarTypes'

/**
 * `meeting_weekdays` uses ISO numbering: 1 is Monday through 7 is Sunday. The backend sorts and
 * de-duplicates the list, so the editor may submit selections in any order.
 *
 * meeting_weekdays 采用 ISO 编号：1 为周一，7 为周日。后端会排序去重，编辑器可按任意顺序提交。
 */
export interface CourseEnrolmentInput {
  course_code: string
  course_title?: string | null
  section_code?: string | null
  term_code: string
  meeting_weekdays: number[]
  starts_at?: IsoTimeString | null
  ends_at?: IsoTimeString | null
  location?: string | null
  instructor?: string | null
}

export interface CourseEnrolmentRecord extends CourseEnrolmentInput {
  id: UuidString
  is_active: boolean
}

/** One class occurring on the digest's date, already sorted by start time. */
export interface CourseScheduleEntry {
  course_code: string
  course_title?: string | null
  section_code?: string | null
  starts_at?: IsoTimeString | null
  ends_at?: IsoTimeString | null
  location?: string | null
}

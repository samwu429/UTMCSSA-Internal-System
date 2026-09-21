import type { UuidString } from '@/shared/api/contracts/common/scalarTypes'

export interface OfficeHolderView {
  user_id: UuidString
  display_name: string
  membership_id: UuidString
}

export interface OfficeSeatView {
  office_key: string
  office_name_zh: string
  office_name_en: string
  seat_limit: number
  holders: OfficeHolderView[]
  can_appoint: boolean
  can_release: boolean
}

export interface DepartmentOfficeBoard {
  department_id: UuidString
  department_slug: string
  department_name_zh: string
  department_name_en: string
  offices: OfficeSeatView[]
}

export interface OfficeBoard {
  departments: DepartmentOfficeBoard[]
}

export interface OfficeAppointment {
  user_id: UuidString
  department_id: UuidString
  office_key: string
  term_label?: string | null
}

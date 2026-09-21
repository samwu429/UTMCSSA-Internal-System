import type { UuidString } from '@/shared/api/contracts/common/scalarTypes'

export interface DepartmentSummary {
  id: UuidString
  slug: string
  name_en: string
  name_zh: string
  summary_en?: string | null
  summary_zh?: string | null
  accent_color: string
  portal_modules: string[]
  has_organization_oversight: boolean
  is_active: boolean
  sort_order: number
  parent_id?: UuidString | null
}

export interface DepartmentWithHeadcount extends DepartmentSummary {
  member_count: number
  pending_count: number
}

export interface DepartmentCreate {
  slug: string
  name_en: string
  name_zh: string
  summary_en?: string | null
  summary_zh?: string | null
  accent_color: string
  portal_modules: string[]
  has_organization_oversight: boolean
  parent_id?: UuidString | null
  sort_order: number
}

export interface DepartmentUpdate {
  name_en?: string | null
  name_zh?: string | null
  summary_en?: string | null
  summary_zh?: string | null
  accent_color?: string | null
  portal_modules?: string[] | null
  has_organization_oversight?: boolean | null
  is_active?: boolean | null
  parent_id?: UuidString | null
  sort_order?: number | null
}

import type { GrantScope } from '@/shared/api/contracts/authorization/grantScope'
import type { UuidString } from '@/shared/api/contracts/common/scalarTypes'

/** One checkbox in the permission editor. */
export interface PermissionOption {
  value: string
  label_en: string
  label_zh: string
}

/** A labelled section of the permission editor. */
export interface PermissionGroupView {
  key: string
  label_en: string
  label_zh: string
  options: PermissionOption[]
}

export interface PermissionCatalog {
  groups: PermissionGroupView[]
}

export interface RoleSummary {
  id: UuidString
  key?: string | null
  name_en: string
  name_zh: string
  description_en?: string | null
  description_zh?: string | null
  scope: GrantScope
  department_id?: UuidString | null
  is_system_managed: boolean
  sort_order: number
  permission_count: number
  assigned_member_count: number
}

export interface RoleDetail extends RoleSummary {
  permissions: string[]
}

export interface RoleCreate {
  name_en: string
  name_zh: string
  description_en?: string | null
  description_zh?: string | null
  scope: GrantScope
  department_id?: UuidString | null
  permissions: string[]
  sort_order: number
}

export interface RoleUpdate {
  name_en?: string | null
  name_zh?: string | null
  description_en?: string | null
  description_zh?: string | null
  scope?: GrantScope | null
  permissions?: string[] | null
  sort_order?: number | null
}

export interface MembershipAssignment {
  user_id: UuidString
  department_id: UuidString
  role_id: UuidString
  is_primary: boolean
  title_en?: string | null
  title_zh?: string | null
  term_label?: string | null
}

export interface MembershipUpdate {
  role_id?: UuidString | null
  is_primary?: boolean | null
  title_en?: string | null
  title_zh?: string | null
  term_label?: string | null
}

import type { IdentityLens } from '@/shared/api/contracts/identity/sessionProfile'
import type { PendingRegistration } from '@/shared/api/contracts/organization/administration'
import type { OfficeBoard } from '@/shared/api/contracts/organization/appointment'
import {
  DEPARTMENT_DEPUTY_ROLE_KEY,
  DEPARTMENT_DIRECTOR_ROLE_KEY,
  PRESIDIUM_DEPARTMENT_SLUG,
  PRESIDIUM_EXTERNAL_VP_ROLE_KEY,
  PRESIDIUM_INTERNAL_VP_ROLE_KEY,
  PRESIDIUM_PRESIDENT_ROLE_KEY,
  PRESIDIUM_SECRETARY_GENERAL_ROLE_KEY,
} from '@/shared/organization/offices'

const PRESIDIUM_APPOINTMENTS = [
  PRESIDIUM_PRESIDENT_ROLE_KEY,
  PRESIDIUM_SECRETARY_GENERAL_ROLE_KEY,
  PRESIDIUM_INTERNAL_VP_ROLE_KEY,
  PRESIDIUM_EXTERNAL_VP_ROLE_KEY,
] as const

/**
 * Narrow the office board to the seat the hidden administrator is previewing.
 *
 * The API still authorizes the real technical account; this filter keeps the preview honest so
 * a director view does not show every presidential appointment.
 *
 * 按管理员正在预览的职务收窄任职板。接口仍按技术账号鉴权；
 * 此处过滤是为了让「部长视图」不会露出主席才能任命的席位。
 */
export function filterOfficeBoardForPreview(
  board: OfficeBoard,
  actingLens: IdentityLens | null,
): OfficeBoard {
  if (actingLens === null) {
    return board
  }
  if (actingLens.office_key === PRESIDIUM_PRESIDENT_ROLE_KEY) {
    return {
      departments: board.departments
        .map((department) => ({
          ...department,
          offices: department.offices.filter((office) =>
            department.department_slug === PRESIDIUM_DEPARTMENT_SLUG
              ? PRESIDIUM_APPOINTMENTS.includes(
                  office.office_key as (typeof PRESIDIUM_APPOINTMENTS)[number],
                )
              : office.office_key === DEPARTMENT_DIRECTOR_ROLE_KEY,
          ),
        }))
        .filter((department) => department.offices.length > 0),
    }
  }
  if (actingLens.office_key === DEPARTMENT_DIRECTOR_ROLE_KEY) {
    return {
      departments: board.departments
        .filter((department) => department.department_slug === actingLens.department_slug)
        .map((department) => ({
          ...department,
          offices: department.offices.filter((office) => office.office_key === DEPARTMENT_DEPUTY_ROLE_KEY),
        }))
        .filter((department) => department.offices.length > 0),
    }
  }
  return { departments: [] }
}

export function filterPendingForPreview(
  pending: readonly PendingRegistration[],
  actingLens: IdentityLens | null,
): PendingRegistration[] {
  if (actingLens === null) {
    return [...pending]
  }
  if (actingLens.office_key === PRESIDIUM_PRESIDENT_ROLE_KEY) {
    return pending.filter((item) => item.requested_department_slug === PRESIDIUM_DEPARTMENT_SLUG)
  }
  if (
    actingLens.office_key === DEPARTMENT_DIRECTOR_ROLE_KEY ||
    actingLens.office_key === DEPARTMENT_DEPUTY_ROLE_KEY
  ) {
    return pending.filter((item) => item.requested_department_slug === actingLens.department_slug)
  }
  return []
}

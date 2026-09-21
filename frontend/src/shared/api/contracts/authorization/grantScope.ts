/**
 * Breadth of a permission grant: department-confined or association-wide.
 *
 * 权限授予的生效范围：限于本部门，或覆盖全社团。
 */
export const GrantScope = {
  DEPARTMENT: 'department',
  ORGANIZATION: 'organization',
} as const

export type GrantScope = (typeof GrantScope)[keyof typeof GrantScope]

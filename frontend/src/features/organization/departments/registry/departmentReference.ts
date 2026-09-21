/**
 * The departments known at build time.
 *
 * Departments are editable at runtime and the API remains the source of truth; this table exists
 * for the two moments the API cannot answer: the public sign-up form, which has no credentials to
 * list departments with, and the first paint of a portal before its configuration arrives.
 *
 * 部门可在运行时调整，接口始终是权威来源；此表仅服务于接口无法作答的两个时刻：
 * 尚无凭据的公开注册表单，以及门户配置到达之前的首次渲染。
 */
export interface DepartmentReference {
  slug: string
  name_zh: string
  name_en: string
  accent_color: string
}

export const DEPARTMENT_REFERENCES: readonly DepartmentReference[] = [
  { slug: 'presidium', name_zh: '主席团', name_en: 'Presidium', accent_color: '#8C1D40' },
  {
    slug: 'administration',
    name_zh: '行政部',
    name_en: 'Administration',
    accent_color: '#2F4858',
  },
  { slug: 'finance', name_zh: '财政部', name_en: 'Finance', accent_color: '#1B6B4C' },
  { slug: 'sponsorship', name_zh: '赞助部', name_en: 'Sponsorship', accent_color: '#B5651D' },
  { slug: 'events', name_zh: '活动部', name_en: 'Events', accent_color: '#C0392B' },
  { slug: 'publicity', name_zh: '宣传部', name_en: 'Publicity', accent_color: '#7D3C98' },
  { slug: 'academic', name_zh: '学术部', name_en: 'Academic', accent_color: '#1F618D' },
  { slug: 'alumni', name_zh: '毕业生校友', name_en: 'Alumni Network', accent_color: '#946B2D' },
  {
    slug: 'platform-admin',
    name_zh: '管理员账户',
    name_en: 'Platform Administration',
    accent_color: '#2C3E50',
  },
]

export function findDepartmentReference(slug: string): DepartmentReference | undefined {
  return DEPARTMENT_REFERENCES.find((department) => department.slug === slug)
}

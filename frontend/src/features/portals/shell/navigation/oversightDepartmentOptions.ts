export interface OversightDepartmentOption {
  slug: string
  name_zh: string
}

/**
 * Every seeded department portal. Used so an oversight account can switch immediately, even
 * before the department list finishes loading.
 *
 * 全部初始部门门户。监管账号可据此立即切换，不必等部门列表接口返回。
 */
export const OVERSIGHT_DEPARTMENT_OPTIONS: readonly OversightDepartmentOption[] = [
  { slug: 'presidium', name_zh: '主席团' },
  { slug: 'administration', name_zh: '行政部' },
  { slug: 'finance', name_zh: '财政部' },
  { slug: 'sponsorship', name_zh: '赞助部' },
  { slug: 'events', name_zh: '活动部' },
  { slug: 'publicity', name_zh: '宣传部' },
  { slug: 'academic', name_zh: '学术部' },
  { slug: 'alumni', name_zh: '毕业生校友' },
]

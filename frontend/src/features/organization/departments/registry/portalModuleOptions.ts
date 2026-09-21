/**
 * Portal modules a department can expose. The admin console uses this list as checkboxes when
 * editing a department; the sidebar later reads the saved identifiers from the API.
 *
 * 部门可开放的门户模块。管理后台编辑部门时以此作为勾选项；侧栏随后读取接口保存的标识。
 */
export interface PortalModuleOption {
  value: string
  label_zh: string
  label_en: string
}

export const PORTAL_MODULE_OPTIONS: readonly PortalModuleOption[] = [
  { value: 'overview', label_zh: '部门主页', label_en: 'Overview' },
  { value: 'announcements', label_zh: '公告', label_en: 'Announcements' },
  { value: 'department_directory', label_zh: '成员名录', label_en: 'Directory' },
  { value: 'document_vault', label_zh: '文件库', label_en: 'Documents' },
  { value: 'activity_calendar', label_zh: '活动日历', label_en: 'Activities' },
  { value: 'sponsor_pipeline', label_zh: '赞助跟进', label_en: 'Sponsors' },
  { value: 'budget_ledger', label_zh: '预算台账', label_en: 'Budget' },
  { value: 'content_calendar', label_zh: '宣传排期', label_en: 'Content' },
  { value: 'academic_resources', label_zh: '学术支持', label_en: 'Academic' },
  { value: 'alumni_network', label_zh: '校友网络', label_en: 'Alumni' },
  { value: 'cross_department_oversight', label_zh: '跨部门监管', label_en: 'Oversight' },
  { value: 'admin_console', label_zh: '管理后台', label_en: 'Admin' },
]

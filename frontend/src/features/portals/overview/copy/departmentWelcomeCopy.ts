export interface DepartmentWelcomeCopy {
  headline: string
  focus: string
}

const FALLBACK: DepartmentWelcomeCopy = {
  headline: '工作台',
  focus: '名录、文件与活动。',
}

export const DEPARTMENT_WELCOME_COPY: Record<string, DepartmentWelcomeCopy> = {
  presidium: {
    headline: '主席团',
    focus: '任职、审批与全社运转。',
  },
  administration: {
    headline: '行政部',
    focus: '档案、纪要与内部流程。',
  },
  finance: {
    headline: '财政部',
    focus: '预算、报销与资金。',
  },
  sponsorship: {
    headline: '赞助部',
    focus: '赞助沟通与履约材料。',
  },
  events: {
    headline: '活动部',
    focus: '活动策划与执行。',
  },
  publicity: {
    headline: '宣传部',
    focus: '物料、社媒与视觉资产。',
  },
  academic: {
    headline: '学术部',
    focus: '学业支持与学术活动。',
  },
  alumni: {
    headline: '校友网络',
    focus: '在校生与毕业生联络。',
  },
  'platform-admin': {
    headline: '平台管理',
    focus: '账号、权限与部门结构。',
  },
}

export function welcomeCopyFor(slug: string): DepartmentWelcomeCopy {
  return DEPARTMENT_WELCOME_COPY[slug] ?? FALLBACK
}

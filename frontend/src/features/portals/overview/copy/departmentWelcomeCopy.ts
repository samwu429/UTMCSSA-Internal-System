/**
 * Department-owned landing copy.
 *
 * Each portal reuses the same layout, but the first screen names the department's actual work so
 * a member never lands on a generic "internal system" page.
 *
 * 各部门自己的落地文案。门户共用同一布局，但首页必须点名该部门的实际工作，
 * 避免成员进入一个泛化的「内部系统」页面。
 */
export interface DepartmentWelcomeCopy {
  headline: string
  focus: string
  firstAction: string
}

const FALLBACK: DepartmentWelcomeCopy = {
  headline: '欢迎回到部门工作台',
  focus: '从本页进入名录、文件库与活动安排。',
  firstAction: '先查看本部门公告和即将到来的活动。',
}

export const DEPARTMENT_WELCOME_COPY: Record<string, DepartmentWelcomeCopy> = {
  presidium: {
    headline: '主席团工作台',
    focus: '审批新成员、分配部门与权限，并查看全社运转情况。',
    firstAction: '今天先处理待审批注册，再看各部活动和文件。',
  },
  administration: {
    headline: '行政部工作台',
    focus: '维护成员档案、会议纪要与内部流程。',
    firstAction: '先核对成员名录，再整理本周行政文件。',
  },
  finance: {
    headline: '财政部工作台',
    focus: '管理预算、报销与活动资金流转。',
    firstAction: '先核对本期预算台账，再处理待归档的报销文件。',
  },
  sponsorship: {
    headline: '赞助部工作台',
    focus: '推进赞助商沟通、协议与履约材料。',
    firstAction: '先查看进行中的赞助跟进，再补充最新提案。',
  },
  events: {
    headline: '活动部工作台',
    focus: '策划、执行并复盘社团活动。',
    firstAction: '先确认近期活动节点，再上传最新策划案。',
  },
  publicity: {
    headline: '宣传部工作台',
    focus: '安排设计物料、社媒发布与视觉资产。',
    firstAction: '先看本周宣传排期，再归档最新物料。',
  },
  academic: {
    headline: '学术部工作台',
    focus: '组织学业支持、课程资源与学术活动。',
    firstAction: '先核对本学期课表，再查看学术活动安排。',
  },
  alumni: {
    headline: '校友网络',
    focus: '连接在校生与毕业生，维护导师与职业信息。',
    firstAction: '先完善自己的校友档案，再浏览可联络的学长学姐。',
  },
  'platform-admin': {
    headline: '平台管理',
    focus: '维护账号、权限集合、部门结构与系统设置。',
    firstAction: '先处理待审批账号，再检查权限集合是否仍然准确。',
  },
}

export function welcomeCopyFor(slug: string): DepartmentWelcomeCopy {
  return DEPARTMENT_WELCOME_COPY[slug] ?? FALLBACK
}

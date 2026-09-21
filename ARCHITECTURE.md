# Architecture

The platform is one backend serving many department-facing frontends. A member never chooses a
portal: the server computes it from the primary department membership and returns `landing_path`
on sign-in. The React application only follows that address and paints the department's own name,
accent colour, and module list.

本平台是「一个后端、多套部门前端」。成员不选择门户：服务端根据主归属部门计算 `landing_path`，
登录响应直接返回。React 应用只跟随该地址，并使用该部门自己的名称、主色与模块列表渲染。

## Layers

```
frontend/src/app                  routing, providers, global styles
frontend/src/features             authentication, portals, directory, documents, administration
frontend/src/shared               API client, contracts, UI primitives

backend/app/api                  HTTP adapters
backend/app/domain               identity, organization, directory, documents, activities, notifications
backend/app/core                 settings, security, errors
backend/app/infrastructure       database, email (Resend), storage, weather, scheduler
```

Dependency direction is inward: routes call domain services; domain services do not import FastAPI
or React. Portal theming lives only in the frontend. Authorization is evaluated again on every
mutating request.

依赖方向向内：路由调用领域服务；领域服务不导入 FastAPI 或 React。门户换肤只存在于前端。
每次写操作都会在服务端再次鉴权。

## Identity and placement

1. Registration accepts `@mail.utoronto.ca`, `@utoronto.ca`, `@alum.utoronto.ca`, and
   `@alumni.utoronto.ca`. The domain decides student versus alumnus.
2. A six-digit mailbox code must be confirmed before the account becomes visible to the presidium.
3. A presidium or platform administrator assigns a department and a named permission set.
4. Sign-in redirects to `/portal/{department-slug}`. Other departments are reachable only when the
   account holds organization oversight.

注册仅接受多伦多大学邮箱；邮箱验证通过后进入主席团审批；审批时指定部门与权限集合；
登录后跳转到该部门门户。只有监管账号可以打开其他部门地址。

## Permission sets

Roles are named bundles (`部门成员`, `部门干事`, `部长 / 副部长`, `主席团成员`, `毕业生校友`,
`平台管理员`). The console presents them as cards. Raw permission identifiers stay in the catalog
for technical edits; day-to-day placement uses the cards.

角色是命名的权限集合。管理后台以卡片呈现。日常分配使用卡片，而不是勾选原始权限标识。

## Documents and notifications

Each department is seeded with governance, planning, finance, and archive categories. Planning
has proposal / run-of-show / review children. Daily digest mail at 07:00 America/Toronto includes
the date, Mississauga weather, the member's courses for that weekday, and published activities.

每个部门预置治理、策划、财务与归档分类。每日 7:00（多伦多时间）邮件包含日期、密西沙加天气、
当天课程与已发布活动。

# UTMCSSA Internal System

Internal operations platform for the UTM Chinese Students and Scholars Association.

多伦多大学密西沙加中国学生学者联谊会内部工作平台。

Members sign in with a University of Toronto mailbox. After approval they land in their own
department system. The backend stays shared so the presidium can supervise every department
without making a finance officer feel they opened a generic admin site.

成员使用多伦多大学邮箱登录；审批通过后进入所属部门自己的系统。后端统一，主席团可监管各部门，
但财政部、活动部等在前端看到的是本部门页面。

## What is included

- Account and password sign-in
- Student (`@mail.utoronto.ca`, `@utoronto.ca`) and alumni (`@alum.utoronto.ca`, `@alumni.utoronto.ca`) registration
- Email verification codes
- Member directory with graduation year
- Alumni and current-student network
- Department-scoped document vault (governance files and activity planning files)
- Activity calendar with email notices
- Daily digest: date, weather, courses, and activities
- Named permission sets assigned by the presidium
- A simplified presidium console for non-technical officers

## Departments

赞助部, 财政部, 活动部, 行政部, 宣传部, 学术部, 主席团, 毕业生校友, 管理员账户.

Each portal has its own colour, copy, and module list. Oversight departments can open another
portal for supervision; the page they see is still that department's system.

每个门户有独立配色、文案与模块。监管部门可打开其他门户查看，但页面仍是该部门自己的系统。

## Local setup

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
copy .env.example .env
```

Fill `DATABASE_URL` with the Neon connection string, `JWT_SECRET_KEY` with a random value, and
optionally `RESEND_API_KEY`. Leaving the Resend key empty prints verification codes to the backend
log. Set `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` once to create the first
administrator, then remove them.

```powershell
alembic upgrade head
uvicorn app.main:app --reload --app-dir .
```

The API listens on `http://localhost:8000`. OpenAPI is available at `/docs` outside production.

### Frontend

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

The interface listens on `http://localhost:5173`.

## Public site

The repository README is not the application. Members open the hosted site:

- Application: `https://utmcssa-internal-system.onrender.com/`
- Mirror interface: `https://samwu429.github.io/UTMCSSA-Internal-System/`

After sign-in, administrators use **切换部门系统** at the top to open every department’s own page. The administrator role already carries every permission, so those pages are fully operable.

The first administrator is created from `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` on API startup. Remove those two values after the account exists.

A free Render instance sleeps after idle time. The first request after sleep can take about a minute.

## Daily mail

`SCHEDULER_ENABLED=true` sends the digest at `DAILY_DIGEST_HOUR`:`DAILY_DIGEST_MINUTE` in
`ORGANIZATION_TIMEZONE` (default 07:00 America/Toronto). Members can turn the digest and activity
notices off from 我的档案.

## Checks

```powershell
cd backend
ruff check .
pytest
```

```powershell
cd frontend
npm run lint
npm run build
```

Author: Yihang (Sam) Wu

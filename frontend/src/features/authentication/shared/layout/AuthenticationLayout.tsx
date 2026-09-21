import type { ReactNode } from 'react'

export interface AuthenticationLayoutProps {
  title: string
  englishTitle?: string
  description?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

export function AuthenticationLayout({
  title,
  description,
  footer,
  children,
}: AuthenticationLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(280px,38%)_1fr]">
      <aside className="hidden flex-col justify-between bg-[var(--sidebar)] px-10 py-12 text-[var(--sidebar-text)] lg:flex">
        <div>
          <p className="font-mono text-[11px] tracking-[0.22em] text-white/40">UTMCSSA</p>
          <h1 className="mt-8 text-[28px] leading-tight font-semibold text-white">内部工作台</h1>
          <p className="mt-4 max-w-xs text-[13px] leading-6 text-white/50">
            部门事务、任职审批与文件在此处理。
          </p>
        </div>
        <p className="text-[11px] text-white/30">University of Toronto Mississauga</p>
      </aside>

      <main className="flex items-center justify-center bg-[var(--paper)] px-6 py-12">
        <div className="w-full max-w-[360px]">
          <p className="mb-8 font-mono text-[11px] tracking-[0.22em] text-[var(--ink-faint)] lg:hidden">
            UTMCSSA
          </p>
          <h1 className="text-[20px] font-semibold text-[var(--ink)]">{title}</h1>
          {description !== undefined ? (
            <p className="mt-2 text-[13px] text-[var(--ink-muted)]">{description}</p>
          ) : null}
          <div className="mt-6">{children}</div>
          {footer !== undefined ? (
            <div className="mt-6 text-[13px] text-[var(--ink-muted)]">{footer}</div>
          ) : null}
        </div>
      </main>
    </div>
  )
}

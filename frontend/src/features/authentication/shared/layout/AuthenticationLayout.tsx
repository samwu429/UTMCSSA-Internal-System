import type { ReactNode } from 'react'

export interface AuthenticationLayoutProps {
  title: string
  englishTitle: string
  description?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

/**
 * The frame shared by every screen outside a department portal.
 *
 * These screens precede any department membership, so they stay on the neutral association mark
 * rather than adopting an accent colour.
 *
 * 门户之外页面的统一框架。此时成员尚未确定部门归属，因此保持社团中性配色，不套用部门主色。
 */
export function AuthenticationLayout({
  title,
  englishTitle,
  description,
  footer,
  children,
}: AuthenticationLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-100">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-baseline gap-3 px-6 py-4">
          <span className="text-sm font-semibold tracking-tight text-neutral-900">
            多伦多大学密西沙加中国学生学者联谊会
          </span>
          <span className="text-xs text-neutral-400">UTMCSSA Internal System</span>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-6 py-10">
        <div className="w-full max-w-xl">
          <div className="rounded-lg border border-neutral-200 bg-white shadow-xs">
            <div className="border-b border-neutral-200 px-6 py-5">
              <div className="flex flex-wrap items-baseline gap-2">
                <h1 className="text-lg font-semibold tracking-tight text-neutral-900">{title}</h1>
                <span className="text-xs text-neutral-400">{englishTitle}</span>
              </div>
              {description !== undefined ? (
                <p className="mt-2 text-sm text-neutral-600">{description}</p>
              ) : null}
            </div>
            <div className="px-6 py-5">{children}</div>
          </div>
          {footer !== undefined ? (
            <div className="mt-4 text-center text-sm text-neutral-600">{footer}</div>
          ) : null}
        </div>
      </main>
    </div>
  )
}

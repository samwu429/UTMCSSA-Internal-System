import { Link } from 'react-router'
import type { ReactNode } from 'react'

export interface TextualLinkProps {
  to: string
  children: ReactNode
}

export function TextualLink({ to, children }: TextualLinkProps) {
  return (
    <Link
      to={to}
      className="font-medium text-[var(--portal-accent)] underline underline-offset-2 hover:text-[var(--portal-accent-strong)]"
    >
      {children}
    </Link>
  )
}

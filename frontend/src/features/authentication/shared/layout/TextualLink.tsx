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
      className="font-medium text-[var(--brand)] underline underline-offset-2 hover:text-[var(--brand-hover)]"
    >
      {children}
    </Link>
  )
}

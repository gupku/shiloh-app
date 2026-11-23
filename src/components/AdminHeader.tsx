import type { ReactNode } from 'react'
import { adminSubtitle, adminTitle, cx } from '../ui.ts'

// Page title + subtitle at the top of each admin page (children = buttons on the right)
export default function AdminHeader({ title, subtitle, titleClassName, children }: { title: string; subtitle: string; titleClassName?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-5">
      <div>
        <h1 className={cx(adminTitle, titleClassName)}>{title}</h1>
        <p className={adminSubtitle}>{subtitle}</p>
      </div>
      {children && <div className="ml-auto flex flex-wrap gap-3">{children}</div>}
    </div>
  )
}

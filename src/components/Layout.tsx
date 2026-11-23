import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import type { Role } from '../../shared/types.ts'
import { useApp } from '../store.tsx'
import { cx } from '../ui.ts'
import ContactHelp from './ContactHelp.tsx'

const LINKS: Record<Role, [path: string, label: string][]> = {
  volunteer: [
    ['/volunteer/dashboard', 'Dashboard'],
    ['/volunteer/assign', 'Assign'],
    ['/volunteer/assigned', 'Assigned'],
  ],
  admin: [
    ['/admin/dashboard', 'Dashboard'],
    ['/admin/hostels', 'Hostel Setup'],
    ['/admin/volunteers', 'Volunteers'],
    ['/admin/rules', 'Allocation Rules'],
    ['/admin/audit', 'Audit & Exports'],
  ],
}

const isSmallScreen = () => window.innerWidth < 1024

// Red sidebar + page area shared by every page of a portal
export default function Layout({ role }: { role: Role }) {
  const { logout } = useApp()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(isSmallScreen)
  const [helpOpen, setHelpOpen] = useState(false)
  const isAdmin = role === 'admin'

  async function signOut() {
    await logout()
    navigate(`/${role}/login`)
  }

  return (
    <div className="min-h-screen">
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Open menu"
          className="fixed left-[18px] top-[18px] z-[25] h-[41px] w-[52px] overflow-hidden rounded-md shadow-[0_4px_8px_rgb(0_0_0/0.25)]"
        >
          <img src="/assets/menu-red.svg" alt="" className="size-full" />
        </button>
      )}

      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-30 flex w-[202px] flex-col overflow-y-auto bg-brand text-white transition-transform duration-300',
          collapsed && '-translate-x-full',
        )}
      >
        <NavLink to={LINKS[role][0][0]} className="flex h-[65px] flex-none items-center gap-1 bg-white py-1.5 pl-1.5 pr-2 text-center">
          <img src="/assets/crest-small.png" alt="Shiloh crest" className="h-[51px] w-[47px] flex-none object-contain" />
          <span
            className={cx(
              'flex-1 font-inter leading-[1.15]',
              isAdmin ? 'text-[15px] font-bold text-[#0f172a]' : 'text-xs font-semibold text-black',
            )}
          >
            Shiloh Hostel Allocation {isAdmin ? 'Admin' : 'Volunteer'}
          </span>
        </NavLink>

        <div className={cx('flex flex-none items-start justify-between px-1.5 pt-[22px]', isAdmin ? 'h-[112px]' : 'h-[115px]')}>
          <span className="font-inter text-2xl font-extrabold">Welcome</span>
          <button onClick={() => setCollapsed(true)} aria-label="Close menu" className="mt-1">
            <img src="/assets/menu-white.svg" alt="" className="h-[31px] w-[47px]" />
          </button>
        </div>

        <nav className={cx('flex flex-col', isAdmin ? 'gap-[54px]' : 'gap-[57px]')}>
          {LINKS[role].map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => isSmallScreen() && setCollapsed(true)}
              className={({ isActive }) =>
                cx(
                  'flex flex-none items-center justify-center px-2.5 text-center font-bold',
                  isAdmin ? 'h-[50px] text-base' : 'h-[65px] text-[32px]',
                  isActive ? 'bg-white text-black shadow-figma' : 'text-white hover:bg-white/10',
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-4 px-3.5 pb-[18px] pt-7">
          {isAdmin ? (
            <p className="text-xs font-bold text-[#22ef58]">System Health: All Systems Operational</p>
          ) : (
            <button onClick={() => setHelpOpen(true)} className="self-start pl-2 text-xl font-bold text-white hover:underline">
              Contact help
            </button>
          )}
          <button
            onClick={signOut}
            className="h-[41px] w-[132px] self-center rounded-[5px] bg-white text-[26px] font-bold text-black shadow-figma hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>
      </aside>

      {!collapsed && <div onClick={() => setCollapsed(true)} className="fixed inset-0 z-20 bg-black/45 lg:hidden" />}

      <main
        className={cx(
          'min-h-screen pb-10 transition-[margin] duration-300 max-lg:ml-0 max-lg:pl-[18px] max-lg:pr-[18px] max-lg:pt-[84px]',
          collapsed ? 'ml-0 pl-[88px] pr-[43px]' : isAdmin ? 'ml-[202px] pl-[38px] pr-[43px]' : 'ml-[202px] pl-[43px] pr-[43px]',
          isAdmin ? 'bg-[#f8fafc] pt-8' : 'pt-[49px] has-[.report-page]:bg-[#f8fafc]',
        )}
      >
        <Outlet />
      </main>

      {helpOpen && <ContactHelp onClose={() => setHelpOpen(false)} />}
    </div>
  )
}

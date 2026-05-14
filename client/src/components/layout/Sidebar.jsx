import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FileSpreadsheet, Users, GitBranch, Wrench, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/ob',         icon: FileSpreadsheet, label: 'OB Manager' },
  { to: '/skills',     icon: Users,           label: 'Skill Matrix' },
  { to: '/allocation', icon: GitBranch,       label: 'Allocation' },
  { to: '/machines',   icon: Wrench,          label: 'Machines' },
  { to: '/checklists', icon: ClipboardList,   label: 'Checklists' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 flex-shrink-0 bg-navy-900 flex flex-col h-full no-print">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-navy-800">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">SMED Manager</p>
            <p className="text-navy-300 text-xs leading-tight">Arvind Limited</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-teal-600 text-white'
                : 'text-slate-400 hover:bg-navy-800 hover:text-white'
            )}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-navy-800">
        <p className="text-navy-400 text-xs">Electronic City, Bengaluru</p>
        <p className="text-navy-500 text-xs">Lines E1–E10</p>
      </div>
    </aside>
  )
}

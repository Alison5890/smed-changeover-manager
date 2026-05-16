import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, AlertTriangle, LogOut, ChevronDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useAuth, ROLES } from '@/contexts/AuthContext'

const TITLES = {
  '/dashboard':  'Dashboard',
  '/ob':         'OB Manager',
  '/skills':     'Skill Matrix',
  '/allocation': 'Allocation Planner',
  '/machines':   'Machine Inventory',
  '/checklists': 'Changeover Checklist',
  '/users':      'User Profiles',
}

export default function TopBar() {
  const { pathname } = useLocation()
  const title = TITLES[pathname] || 'SMED'
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const onClick = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const { data: overdueItems = [] } = useQuery({
    queryKey: ['overdue'],
    queryFn: api.getOverdueItems,
    refetchInterval: 60_000,
    enabled: !!user,
  })

  const { data: t2Alerts = [] } = useQuery({
    queryKey: ['t2alerts'],
    queryFn: api.getT2Alerts,
    refetchInterval: 60_000,
    enabled: !!user,
  })

  const alertCount = overdueItems.length + t2Alerts.length
  const initials = user?.name?.split(' ').map(s => s[0]).slice(0, 2).join('') || '?'

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 no-print">
      <h1 className="text-base font-semibold text-slate-800">{title}</h1>
      <div className="flex items-center gap-3">
        {alertCount > 0 && (
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-lg">
            <AlertTriangle size={13} />
            {alertCount} alert{alertCount > 1 ? 's' : ''}
          </div>
        )}
        <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <Bell size={18} />
          {alertCount > 0 && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />}
        </button>

        <div ref={menuRef} className="relative">
          <button onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors">
            <div className="h-7 w-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-semibold">
              {initials}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-medium text-slate-700 leading-tight">{user?.name}</p>
              <p className="text-[10px] text-slate-500 leading-tight">{ROLES[user?.role]?.label || user?.role}</p>
            </div>
            <ChevronDown size={13} className="text-slate-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <p className="text-sm font-medium text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-500 font-mono">{user?.email}</p>
                <p className="text-xs text-teal-700 mt-1">{ROLES[user?.role]?.label}</p>
              </div>
              <button onClick={() => { logout(); setMenuOpen(false) }}
                className="w-full px-4 py-2.5 flex items-center gap-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors">
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

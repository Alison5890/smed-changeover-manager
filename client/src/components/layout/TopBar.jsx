import { useLocation } from 'react-router-dom'
import { Bell, AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'

const TITLES = {
  '/dashboard':  'Dashboard',
  '/ob':         'OB Manager',
  '/skills':     'Skill Matrix',
  '/allocation': 'Allocation Planner',
  '/machines':   'Machine Inventory',
  '/checklists': 'Changeover Checklist',
}

export default function TopBar() {
  const { pathname } = useLocation()
  const title = TITLES[pathname] || 'SMED'

  const { data: overdueItems = [] } = useQuery({
    queryKey: ['overdue'],
    queryFn: api.getOverdueItems,
    refetchInterval: 60_000,
  })

  const { data: t2Alerts = [] } = useQuery({
    queryKey: ['t2alerts'],
    queryFn: api.getT2Alerts,
    refetchInterval: 60_000,
  })

  const alertCount = overdueItems.length + t2Alerts.length

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
          {alertCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          )}
        </button>
        <div className="h-8 w-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-semibold">
          IE
        </div>
      </div>
    </header>
  )
}

import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Clock, Wrench, Users, FileSpreadsheet, GitBranch, ChevronRight } from 'lucide-react'
import { api } from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { LoadingPage } from '@/components/ui/spinner'
import { fmtDate, daysUntil, STATUS_COLORS, CONDITION_COLORS } from '@/lib/utils'

function StatCard({ icon: Icon, label, value, sub, color = 'teal' }) {
  const colors = { teal: 'bg-teal-50 text-teal-600', amber: 'bg-amber-50 text-amber-600', red: 'bg-red-50 text-red-600', blue: 'bg-blue-50 text-blue-600' }
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
          <Icon size={22} />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800 font-mono">{value ?? '—'}</p>
          <p className="text-xs text-slate-500">{label}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

function LineCard({ card }) {
  const days = daysUntil(card.nextChangeover?.date)
  const urgency = days !== null && days <= 2 ? 'red' : days !== null && days <= 5 ? 'amber' : 'green'

  return (
    <Card className={card.hasAlerts ? 'border-amber-300 bg-amber-50/30' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-bold text-navy-900">{card.lineId}</span>
          {card.hasAlerts && <AlertTriangle size={14} className="text-amber-500" />}
        </div>

        {card.nextChangeover ? (
          <>
            <p className="text-xs text-slate-500 truncate" title={card.nextChangeover.style}>{card.nextChangeover.style}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={urgency === 'red' ? 'red' : urgency === 'amber' ? 'amber' : 'teal'}>
                {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
              </Badge>
              <span className={`text-xs font-medium ${STATUS_COLORS[card.nextChangeover.status] || 'badge-slate'}`}>
                {card.nextChangeover.status}
              </span>
            </div>
            {card.checklistProgress !== null && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Checklist</span><span>{card.checklistProgress}%</span>
                </div>
                <Progress value={card.checklistProgress} color="auto" size="sm" />
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-slate-400 mt-1">No changeover planned</p>
        )}

        {card.machineIssues > 0 && (
          <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
            <Wrench size={11} />
            {card.machineIssues} machine issue{card.machineIssues > 1 ? 's' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: api.getDashboard, refetchInterval: 60_000 })

  if (isLoading) return <LoadingPage />

  const { lineCards = [], upcomingChangeovers = [], alerts = {}, stats = {} } = data || {}

  return (
    <div className="p-6 space-y-6 max-w-screen-xl">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FileSpreadsheet} label="Total OBs"      value={stats.totalOBs}      color="teal" />
        <StatCard icon={Users}          label="Active Workers"  value={stats.totalWorkers}   color="blue" />
        <StatCard icon={Wrench}         label="Total Machines"  value={stats.totalMachines}  color="teal" />
        <StatCard icon={GitBranch}      label="Active Plans"    value={stats.activePlans}    color="amber" />
      </div>

      {/* Alerts row */}
      {(alerts.breakdowns > 0 || alerts.maintenanceDue > 0 || alerts.overdueChecklist > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {alerts.breakdowns > 0 && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertTriangle className="text-red-500 shrink-0" size={18} />
              <div>
                <p className="text-sm font-medium text-red-800">{alerts.breakdowns} Machine{alerts.breakdowns > 1 ? 's' : ''} Down</p>
                <p className="text-xs text-red-600">Breakdown or in repair</p>
              </div>
            </div>
          )}
          {alerts.maintenanceDue > 0 && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <Wrench className="text-amber-500 shrink-0" size={18} />
              <div>
                <p className="text-sm font-medium text-amber-800">{alerts.maintenanceDue} Maintenance Due</p>
                <p className="text-xs text-amber-600">Within 7 days</p>
              </div>
            </div>
          )}
          {alerts.overdueChecklist > 0 && (
            <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
              <Clock className="text-orange-500 shrink-0" size={18} />
              <div>
                <p className="text-sm font-medium text-orange-800">{alerts.overdueChecklist} Overdue Items</p>
                <p className="text-xs text-orange-600">Checklist items past due</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lines grid */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Production Lines</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {lineCards.map(card => <LineCard key={card.lineId} card={card} />)}
        </div>
      </div>

      {/* Upcoming + Alert Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming changeovers */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Changeovers (7 days)</CardTitle>
            <Link to="/allocation" className="text-xs text-teal-600 hover:underline flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {upcomingChangeovers.length === 0 && (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">No changeovers in next 7 days</div>
            )}
            {upcomingChangeovers.map(co => {
              const days = daysUntil(co.date)
              return (
                <div key={co.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-800">{co.lineId}</span>
                      <Badge variant={days <= 2 ? 'red' : days <= 4 ? 'amber' : 'teal'}>
                        {days === 0 ? 'Today' : `${days}d`}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{co.style} — {co.buyer}</p>
                  </div>
                  <span className={STATUS_COLORS[co.status]}>{co.status}</span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Machine issues */}
        <Card>
          <CardHeader>
            <CardTitle>Machine Issues</CardTitle>
            <Link to="/machines" className="text-xs text-teal-600 hover:underline flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {alerts.details?.breakdowns?.length === 0 && (
              <div className="px-5 py-8 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                <CheckCircle2 size={24} className="text-emerald-500" />
                All machines running
              </div>
            )}
            {(alerts.details?.breakdowns || []).map(m => {
              const c = CONDITION_COLORS[m.condition]
              return (
                <div key={m.machineCode} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${c.dot}`} />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{m.machineCode}</p>
                      <p className="text-xs text-slate-500">{m.machineType} — Line {m.currentLine}</p>
                    </div>
                  </div>
                  <span className={c.badge}>{c.label}</span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}

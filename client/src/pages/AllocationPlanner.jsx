import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Zap, Check, AlertCircle, Printer, ChevronRight, User } from 'lucide-react'
import { api } from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { LoadingPage } from '@/components/ui/spinner'
import { fmtDate, daysUntil, GRADE_COLORS, MACHINE_COLORS, STATUS_COLORS, LINES } from '@/lib/utils'

function StatusBadge({ status }) {
  const map = { DRAFT: 'badge-slate', CONFIRMED: 'badge-blue', ACTIVE: 'badge-green', COMPLETED: 'badge-slate' }
  return <span className={map[status] || 'badge-slate'}>{status}</span>
}

function MatchDot({ score }) {
  if (!score) return <span className="h-2 w-2 rounded-full bg-red-400 inline-block" title="No match" />
  if (score >= 0.8) return <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" title={`${Math.round(score*100)}%`} />
  if (score >= 0.6) return <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" title={`${Math.round(score*100)}%`} />
  return <span className="h-2 w-2 rounded-full bg-orange-400 inline-block" title={`${Math.round(score*100)}%`} />
}

function AllocationDetailDialog({ planId, open, onClose }) {
  const qc = useQueryClient()
  const { data: plan, isLoading } = useQuery({
    queryKey: ['plan', planId],
    queryFn: () => api.getPlan(planId),
    enabled: !!planId && open,
  })

  const genMut = useMutation({
    mutationFn: () => api.generateAllocation(planId),
    onSuccess: () => qc.invalidateQueries(['plan', planId]),
  })

  const confirmMut = useMutation({
    mutationFn: () => api.updatePlanStatus(planId, 'CONFIRMED'),
    onSuccess: () => { qc.invalidateQueries(['plan', planId]); qc.invalidateQueries(['plans']) },
  })

  const [editEntry, setEditEntry] = useState(null)
  const [selectedWorker, setSelectedWorker] = useState('')

  const { data: lineWorkers = [] } = useQuery({
    queryKey: ['lineworkers', plan?.lineId],
    queryFn: () => api.getLineWorkers(plan.lineId),
    enabled: !!plan?.lineId && !!editEntry,
  })

  const swapMut = useMutation({
    mutationFn: ({ entryId, workerId }) => api.updateEntry(entryId, { workerId }),
    onSuccess: () => { qc.invalidateQueries(['plan', planId]); setEditEntry(null) },
  })

  if (!open) return null

  const gaps = plan?.entries?.filter(e => !e.workerId) || []
  const confirmed = plan?.status === 'CONFIRMED' || plan?.status === 'ACTIVE'

  return (
    <Dialog open={open} onClose={onClose} title={plan ? `Allocation — ${plan.ob?.styleName} (${plan.lineId})` : 'Loading…'} size="xl">
      {isLoading ? <LoadingPage /> : plan ? (
        <div className="p-6 space-y-4">
          {/* Header info */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Line', val: plan.lineId },
              { label: 'Changeover', val: fmtDate(plan.changeoverDate) },
              { label: 'Status', val: <StatusBadge status={plan.status} /> },
              { label: 'Gaps', val: gaps.length, isAlert: gaps.length > 0 },
            ].map(({ label, val, isAlert }) => (
              <div key={label} className={`rounded-lg p-3 ${isAlert && gaps.length > 0 ? 'bg-red-50 border border-red-200' : 'bg-slate-50'}`}>
                <p className="text-xs text-slate-500">{label}</p>
                <p className={`font-semibold text-sm ${isAlert && gaps.length > 0 ? 'text-red-700' : 'text-slate-800'}`}>{val}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={() => genMut.mutate()} disabled={genMut.isPending}>
              <Zap size={13} /> {genMut.isPending ? 'Generating…' : 'Auto-Allocate'}
            </Button>
            {!confirmed && (
              <Button variant="outline" size="sm" onClick={() => confirmMut.mutate()} disabled={confirmMut.isPending}>
                <Check size={13} /> Confirm Plan
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Printer size={13} /> Print
            </Button>
          </div>

          {gaps.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-700 flex items-center gap-1 mb-1"><AlertCircle size={12} /> {gaps.length} unallocated operation{gaps.length > 1 ? 's' : ''}</p>
              <p className="text-xs text-red-600">{gaps.map(e => e.operation?.description).join(', ')}</p>
            </div>
          )}

          {/* Allocation table */}
          <div className="overflow-auto max-h-[50vh]">
            <table className="w-full data-table">
              <thead className="sticky top-0 z-10"><tr>
                <th>#</th><th>Operation</th><th>M/C</th><th>Assigned Worker</th><th>Grade</th><th>Match</th><th>Override</th>
              </tr></thead>
              <tbody>
                {(plan.entries || []).map(entry => (
                  <tr key={entry.id} className={!entry.workerId ? 'bg-red-50' : entry.isManualOverride ? 'bg-blue-50/30' : ''}>
                    <td className="font-mono text-slate-500">{entry.operation?.slNo}</td>
                    <td className="font-medium">
                      {entry.operation?.isCritical && <span className="text-amber-500 mr-1">★</span>}
                      {entry.operation?.description}
                    </td>
                    <td><span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: `${MACHINE_COLORS[entry.operation?.machineType]}20`, color: MACHINE_COLORS[entry.operation?.machineType] }}>{entry.operation?.machineType}</span></td>
                    <td>
                      {entry.worker ? (
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-slate-400" />
                          <span className="text-sm">{entry.worker.name}</span>
                          {entry.isManualOverride && <Badge variant="blue" className="text-xs">Manual</Badge>}
                        </div>
                      ) : (
                        <span className="text-red-500 text-xs flex items-center gap-1"><AlertCircle size={11} /> Unallocated</span>
                      )}
                    </td>
                    <td>{entry.worker ? <span className={`text-xs px-2 py-0.5 rounded ${GRADE_COLORS[entry.worker?.grade]}`}>{entry.worker?.grade}</span> : '—'}</td>
                    <td className="text-center">{entry.matchScore ? <span className="font-mono text-xs">{Math.round(entry.matchScore * 100)}%</span> : '—'}</td>
                    <td>
                      <button onClick={() => { setEditEntry(entry); setSelectedWorker(entry.workerId || '') }}
                        className="text-xs text-teal-600 hover:underline">
                        Swap
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Swap dialog */}
      {editEntry && (
        <Dialog open={true} onClose={() => setEditEntry(null)} title={`Reassign: ${editEntry.operation?.description}`} size="sm">
          <div className="p-6 space-y-4">
            <Select label="Select Worker" value={selectedWorker} onChange={e => setSelectedWorker(e.target.value)}>
              <option value="">— Unassigned —</option>
              {lineWorkers.map(w => <option key={w.id} value={w.id}>{w.name} ({w.grade}) — {w.empNo}</option>)}
            </Select>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setEditEntry(null)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={() => swapMut.mutate({ entryId: editEntry.id, workerId: selectedWorker || null })}>
                {swapMut.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </Dialog>
  )
}

function NewPlanWizard({ open, onClose }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ lineId: 'E1', obId: '', changeoverDate: '', createdBy: 'IE Engineer' })
  const qc = useQueryClient()

  const { data: obs = [] } = useQuery({ queryKey: ['obs'], queryFn: api.getOBs })

  const createMut = useMutation({
    mutationFn: () => api.createPlan(form),
    onSuccess: async (plan) => {
      await api.generateAllocation(plan.id)
      qc.invalidateQueries(['plans'])
      onClose()
      setStep(1)
      setForm({ lineId: 'E1', obId: '', changeoverDate: '', createdBy: 'IE Engineer' })
    },
  })

  return (
    <Dialog open={open} onClose={onClose} title="New Allocation Plan" size="sm">
      <div className="p-6 space-y-4">
        <Select label="Line" value={form.lineId} onChange={e => setForm(f => ({ ...f, lineId: e.target.value }))}>
          {LINES.map(l => <option key={l}>{l}</option>)}
        </Select>
        <Select label="Style OB *" value={form.obId} onChange={e => setForm(f => ({ ...f, obId: e.target.value }))}>
          <option value="">Select OB…</option>
          {obs.map(ob => <option key={ob.id} value={ob.id}>{ob.styleName} ({ob.buyer})</option>)}
        </Select>
        <Input label="Changeover Date *" type="date" value={form.changeoverDate} onChange={e => setForm(f => ({ ...f, changeoverDate: e.target.value }))} />
        <Input label="Created By" value={form.createdBy} onChange={e => setForm(f => ({ ...f, createdBy: e.target.value }))} />
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => createMut.mutate()} disabled={!form.obId || !form.changeoverDate || createMut.isPending}>
            {createMut.isPending ? 'Creating & Auto-allocating…' : 'Create + Auto-Allocate'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

export default function AllocationPlanner() {
  const [selectedPlanId, setSelectedPlanId] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [filterLine, setFilterLine] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const qc = useQueryClient()

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['plans', filterLine, filterStatus],
    queryFn: () => api.getPlans({ lineId: filterLine, status: filterStatus }),
  })

  const delMut = useMutation({
    mutationFn: api.deletePlan,
    onSuccess: () => qc.invalidateQueries(['plans']),
  })

  if (isLoading) return <LoadingPage />

  return (
    <div className="p-6 space-y-5 max-w-screen-xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Allocation Planner</h2>
          <p className="text-sm text-slate-500">{plans.length} plan{plans.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="primary" onClick={() => setShowNew(true)}><Plus size={15} /> New Plan</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={filterLine} onChange={e => setFilterLine(e.target.value)} className="w-28">
          <option value="">All Lines</option>
          {LINES.map(l => <option key={l}>{l}</option>)}
        </Select>
        <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-36">
          <option value="">All Status</option>
          {['DRAFT','CONFIRMED','ACTIVE','COMPLETED'].map(s => <option key={s}>{s}</option>)}
        </Select>
      </div>

      {/* Plans list */}
      <div className="space-y-2">
        {plans.length === 0 && (
          <div className="text-center py-16 text-slate-400 text-sm">No plans found. Create your first allocation plan.</div>
        )}
        {plans.map(plan => {
          const gaps = plan.entries?.filter(e => !e.workerId).length || 0
          const total = plan.entries?.length || 0
          const days = daysUntil(plan.changeoverDate)

          return (
            <div key={plan.id} onClick={() => setSelectedPlanId(plan.id)}
              className="bg-white border border-slate-200 rounded-lg px-5 py-4 flex items-center justify-between hover:shadow-card-hover transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-navy-900 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {plan.lineId}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{plan.ob?.styleName}</p>
                  <p className="text-xs text-slate-500">{plan.ob?.buyer} • {fmtDate(plan.changeoverDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {gaps > 0 && <Badge variant="red"><AlertCircle size={11} /> {gaps} gap{gaps > 1 ? 's' : ''}</Badge>}
                {days !== null && days >= 0 && <Badge variant={days <= 2 ? 'red' : days <= 5 ? 'amber' : 'teal'}>{days}d</Badge>}
                <StatusBadge status={plan.status} />
                <span className="text-xs text-slate-400">{total - gaps}/{total} allocated</span>
                <ChevronRight size={16} className="text-slate-400" />
              </div>
            </div>
          )
        })}
      </div>

      <AllocationDetailDialog planId={selectedPlanId} open={!!selectedPlanId} onClose={() => setSelectedPlanId(null)} />
      <NewPlanWizard open={showNew} onClose={() => setShowNew(false)} />
    </div>
  )
}

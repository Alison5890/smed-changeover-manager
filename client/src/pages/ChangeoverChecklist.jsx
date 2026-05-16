import { useState, useRef, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Printer, ChevronRight, CheckCircle2, Clock, AlertCircle, Circle, Calendar, AlertTriangle } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import { api } from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { LoadingPage } from '@/components/ui/spinner'
import { fmtDate, daysUntil, LINES, BUYERS } from '@/lib/utils'

const ITEM_ICONS = {
  DONE: <CheckCircle2 size={16} className="text-emerald-500" />,
  DELAYED: <AlertCircle size={16} className="text-red-500" />,
  PENDING: <Circle size={16} className="text-slate-300" />,
  NOT_APPLICABLE: <Circle size={16} className="text-slate-200" />,
}

const SECTIONS_COLOR = {
  'Industrial Engineering': 'border-blue-300 bg-blue-50',
  'COT Kit':               'border-purple-300 bg-purple-50',
  'Line Mechanic':         'border-orange-300 bg-orange-50',
  'Planning':              'border-teal-300 bg-teal-50',
  'Production':            'border-green-300 bg-green-50',
}

function ProgressRing({ pct }) {
  const r = 36, c = 2 * Math.PI * r
  const dash = (pct / 100) * c
  return (
    <svg width={92} height={92} viewBox="0 0 92 92">
      <circle cx={46} cy={46} r={r} fill="none" stroke="#e2e8f0" strokeWidth={8} />
      <circle cx={46} cy={46} r={r} fill="none"
        stroke={pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'}
        strokeWidth={8} strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`} transform="rotate(-90 46 46)" />
      <text x={46} y={46} textAnchor="middle" dominantBaseline="middle" className="font-bold" fontSize={16} fill="#1e293b">{pct}%</text>
    </svg>
  )
}

function ChecklistDetail({ checklistId, open, onClose }) {
  const qc = useQueryClient()
  const printRef = useRef()

  const { data: cl, isLoading } = useQuery({
    queryKey: ['checklist', checklistId],
    queryFn: () => api.getChecklist(checklistId),
    enabled: !!checklistId && open,
  })

  const handlePrint = useReactToPrint({ content: () => printRef.current })

  const updateMut = useMutation({
    mutationFn: ({ itemId, status, remarks }) => api.updateItem(itemId, { status, remarks }),
    onSuccess: () => qc.invalidateQueries(['checklist', checklistId]),
  })

  const updateWipMut = useMutation({
    mutationFn: ({ wipId, data }) => api.updateWIP(wipId, data),
    onSuccess: () => qc.invalidateQueries(['checklist', checklistId]),
  })

  if (!open || !checklistId) return null

  const items = cl?.items || []
  const done = items.filter(i => i.status === 'DONE' || i.status === 'NOT_APPLICABLE').length
  const delayed = items.filter(i => i.status === 'DELAYED').length
  const pending = items.filter(i => i.status === 'PENDING').length
  const pct = items.length ? Math.round((done / items.length) * 100) : 0

  const sections = [...new Set(items.map(i => i.section))]

  return (
    <Dialog open={open} onClose={onClose} title="" size="xl">
      {isLoading ? <LoadingPage /> : cl ? (
        <div ref={printRef}>
          {/* Print header */}
          <div className="px-6 pt-4 pb-3 border-b border-slate-200 print-container">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Changeover Checklist</h2>
                <p className="text-sm text-slate-600">{cl.description} • {cl.buyer} • {cl.styleNumber}</p>
                <p className="text-xs text-slate-500 mt-0.5">Line {cl.lineId} • Changeover: {fmtDate(cl.changeoverDate)}</p>
              </div>
              <div className="flex items-center gap-3 no-print">
                <Button variant="secondary" size="sm" onClick={handlePrint}><Printer size={13} /> Print</Button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-center">
              <div className="flex justify-center md:col-span-1">
                <ProgressRing pct={pct} />
              </div>
              {[
                { label: 'Total', val: items.length, color: 'text-slate-700' },
                { label: 'Done', val: done, color: 'text-emerald-600' },
                { label: 'Pending', val: pending, color: 'text-slate-500' },
                { label: 'Delayed', val: delayed, color: 'text-red-600' },
              ].map(({ label, val, color }) => (
                <div key={label} className="text-center">
                  <p className={`text-2xl font-bold font-mono ${color}`}>{val}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>

            {/* Checklist sections */}
            {sections.map(section => {
              const sectionItems = items.filter(i => i.section === section)
              const sectionDone = sectionItems.filter(i => i.status === 'DONE').length
              const colorCls = SECTIONS_COLOR[section] || 'border-slate-200 bg-slate-50'

              return (
                <div key={section} className={`border rounded-lg ${colorCls.split(' ')[0]} overflow-hidden`}>
                  <div className={`px-4 py-2.5 flex items-center justify-between ${colorCls.split(' ')[1]}`}>
                    <h3 className="text-sm font-semibold text-slate-700">{section}</h3>
                    <span className="text-xs text-slate-500">{sectionDone}/{sectionItems.length}</span>
                  </div>
                  <div className="divide-y divide-white/60">
                    {sectionItems.map(item => (
                      <div key={item.id} className="px-4 py-3 bg-white flex items-start gap-3">
                        <button onClick={() => updateMut.mutate({ itemId: item.id, status: item.status === 'DONE' ? 'PENDING' : 'DONE' })}
                          className="shrink-0 mt-0.5">
                          {ITEM_ICONS[item.status] || ITEM_ICONS.PENDING}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${item.status === 'DONE' ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.activity}</p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs text-slate-400">{item.responsible}</span>
                            {item.dueDate && (
                              <span className={`text-xs ${new Date(item.dueDate) < new Date() && item.status === 'PENDING' ? 'text-red-500' : 'text-slate-400'}`}>
                                Due: {fmtDate(item.dueDate)}
                              </span>
                            )}
                            {item.actualDate && <span className="text-xs text-emerald-600">Done: {fmtDate(item.actualDate)}</span>}
                            {item.remarks && <span className="text-xs text-slate-500 italic">{item.remarks}</span>}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => updateMut.mutate({ itemId: item.id, status: 'DELAYED' })}
                            className={`text-xs px-2 py-1 rounded ${item.status === 'DELAYED' ? 'bg-red-100 text-red-700' : 'text-slate-400 hover:bg-red-50 hover:text-red-600'}`}>
                            Delay
                          </button>
                          <button onClick={() => updateMut.mutate({ itemId: item.id, status: 'NOT_APPLICABLE' })}
                            className="text-xs px-2 py-1 rounded text-slate-400 hover:bg-slate-100">
                            N/A
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* WIP Tracker */}
            {cl.wipEntries?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">WIP Tracker</h3>
                <div className="overflow-auto">
                  <table className="w-full data-table">
                    <thead><tr>
                      <th>Section</th><th>Prev Style Last Pcs</th><th>New Style First Pcs</th><th>COT Target (min)</th><th>Peak Target (hrs)</th><th>Remarks</th>
                    </tr></thead>
                    <tbody>
                      {cl.wipEntries.map(wip => (
                        <tr key={wip.id}>
                          <td className="font-semibold text-slate-700">{wip.section}</td>
                          {['prevStyleLast','newStyleFirst','cotTarget'].map(field => (
                            <td key={field}>
                              <input type="number" defaultValue={wip[field] || ''} onBlur={e => updateWipMut.mutate({ wipId: wip.id, data: { [field]: Number(e.target.value) || null } })}
                                className="h-8 w-20 border border-slate-200 rounded px-2 text-sm text-center font-mono focus:outline-none focus:ring-1 focus:ring-teal-500" />
                            </td>
                          ))}
                          <td>
                            <input type="number" step="0.5" defaultValue={wip.peakTargetHrs || ''} onBlur={e => updateWipMut.mutate({ wipId: wip.id, data: { peakTargetHrs: Number(e.target.value) || null } })}
                              className="h-8 w-16 border border-slate-200 rounded px-2 text-sm text-center font-mono focus:outline-none focus:ring-1 focus:ring-teal-500" />
                          </td>
                          <td>
                            <input defaultValue={wip.remarks || ''} onBlur={e => updateWipMut.mutate({ wipId: wip.id, data: { remarks: e.target.value } })}
                              className="h-8 w-32 border border-slate-200 rounded px-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Dialog>
  )
}

function NewChecklistDialog({ open, onClose }) {
  const [form, setForm] = useState({ lineId: 'E1', buyer: 'GAP', styleNumber: '', description: '', factoryLine: 'E1', fileHandoverDate: '', changeoverDate: '', obId: '' })
  const qc = useQueryClient()
  const { data: obs = [] } = useQuery({ queryKey: ['obs'], queryFn: api.getOBs })

  const mut = useMutation({
    mutationFn: () => api.createChecklist(form),
    onSuccess: () => { qc.invalidateQueries(['checklists']); onClose(); setForm({ lineId: 'E1', buyer: 'GAP', styleNumber: '', description: '', factoryLine: 'E1', fileHandoverDate: '', changeoverDate: '', obId: '' }) },
  })

  return (
    <Dialog open={open} onClose={onClose} title="New Changeover Checklist" size="sm">
      <div className="p-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Select label="Line *" value={form.lineId} onChange={e => setForm(f => ({ ...f, lineId: e.target.value, factoryLine: e.target.value }))}>
            {LINES.map(l => <option key={l}>{l}</option>)}
          </Select>
          <Select label="Buyer *" value={form.buyer} onChange={e => setForm(f => ({ ...f, buyer: e.target.value }))}>
            {BUYERS.map(b => <option key={b}>{b}</option>)}
          </Select>
          <Input label="Style Number *" value={form.styleNumber} onChange={e => setForm(f => ({ ...f, styleNumber: e.target.value }))} className="col-span-2" />
          <Input label="Description *" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="col-span-2" placeholder="e.g. Round Neck T-Shirt" />
          <Input label="File Handover Date *" type="date" value={form.fileHandoverDate} onChange={e => setForm(f => ({ ...f, fileHandoverDate: e.target.value }))} />
          <Input label="Changeover Date *" type="date" value={form.changeoverDate} onChange={e => setForm(f => ({ ...f, changeoverDate: e.target.value }))} />
          <Select label="Link OB (optional)" value={form.obId} onChange={e => setForm(f => ({ ...f, obId: e.target.value }))} className="col-span-2">
            <option value="">— None —</option>
            {obs.map(ob => <option key={ob.id} value={ob.id}>{ob.styleName} ({ob.buyer})</option>)}
          </Select>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => mut.mutate()} disabled={!form.styleNumber || !form.changeoverDate || !form.fileHandoverDate || mut.isPending}>
            {mut.isPending ? 'Creating…' : 'Create Checklist'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function UpcomingPanel({ checklists, plans, onOpen }) {
  // Merge checklists + allocation plans into a single timeline keyed by lineId+date
  const items = useMemo(() => {
    const now = new Date()
    const cutoff = new Date(now.getTime() + 21 * 86400000)
    const byKey = new Map()

    for (const cl of checklists) {
      const d = new Date(cl.changeoverDate)
      if (d < new Date(now.toDateString()) || d > cutoff) continue
      if (cl.status === 'COMPLETED') continue
      const key = `${cl.lineId}|${d.toISOString().slice(0, 10)}`
      const items = cl.items || []
      const done = items.filter(i => i.status === 'DONE' || i.status === 'NOT_APPLICABLE').length
      const delayed = items.filter(i => i.status === 'DELAYED').length
      byKey.set(key, {
        lineId: cl.lineId, date: d, style: cl.description, buyer: cl.buyer, styleNumber: cl.styleNumber,
        checklistId: cl.id, pct: items.length ? Math.round((done / items.length) * 100) : 0,
        total: items.length, done, delayed, planId: null, hasPlan: false,
      })
    }

    for (const p of plans) {
      const d = new Date(p.changeoverDate)
      if (d < new Date(now.toDateString()) || d > cutoff) continue
      if (p.status === 'COMPLETED') continue
      const key = `${p.lineId}|${d.toISOString().slice(0, 10)}`
      const ex = byKey.get(key)
      if (ex) { ex.planId = p.id; ex.hasPlan = true; ex.planStatus = p.status }
      else byKey.set(key, {
        lineId: p.lineId, date: d, style: p.ob?.styleName, buyer: p.ob?.buyer, styleNumber: p.ob?.styleNumber,
        checklistId: null, pct: null, total: 0, done: 0, delayed: 0, planId: p.id, hasPlan: true, planStatus: p.status,
      })
    }

    return Array.from(byKey.values()).sort((a, b) => a.date - b.date).slice(0, 8)
  }, [checklists, plans])

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-5 text-center text-slate-400">
          <Calendar size={28} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm">No changeovers scheduled in the next 21 days.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Calendar size={15} className="text-teal-600" /> Upcoming Scheduled Changeovers
        </h3>
        <span className="text-xs text-slate-500">Next 21 days · {items.length} scheduled</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map(it => {
          const days = daysUntil(it.date)
          const urgency = days <= 2 ? 'border-red-300 bg-red-50' : days <= 5 ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'
          const daysBadge = days <= 2 ? 'red' : days <= 5 ? 'amber' : 'teal'
          return (
            <button key={`${it.lineId}-${it.date.toISOString()}`}
              onClick={() => it.checklistId ? onOpen(it.checklistId) : null}
              disabled={!it.checklistId}
              className={`text-left border rounded-lg p-3 transition-shadow ${urgency} ${it.checklistId ? 'hover:shadow-md cursor-pointer' : 'cursor-default opacity-90'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-navy-900 text-white text-xs font-bold flex items-center justify-center">{it.lineId}</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 leading-tight">{it.style || '—'}</p>
                    <p className="text-[10px] text-slate-500 font-mono leading-tight">{it.styleNumber}</p>
                  </div>
                </div>
                <Badge variant={daysBadge}>{days >= 0 ? `T-${days}` : 'Past'}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{fmtDate(it.date)}</span>
                {it.delayed > 0 && (
                  <span className="flex items-center gap-1 text-red-600 font-medium">
                    <AlertTriangle size={11} /> {it.delayed}
                  </span>
                )}
              </div>
              {it.checklistId ? (
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span>{it.done}/{it.total} tasks</span><span>{it.pct}%</span>
                  </div>
                  <Progress value={it.pct} color="auto" size="sm" />
                </div>
              ) : (
                <div className="mt-2 text-[10px] text-slate-400 italic">
                  {it.hasPlan ? `Allocation plan ${it.planStatus} — no checklist yet` : 'No checklist'}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function ChangeoverChecklist() {
  const [filterLine, setFilterLine] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [showNew, setShowNew] = useState(false)

  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ['checklists', filterLine, filterStatus],
    queryFn: () => api.getChecklists({ lineId: filterLine, status: filterStatus }),
  })

  // Pull all checklists (unfiltered) for the upcoming panel
  const { data: allChecklists = [] } = useQuery({
    queryKey: ['checklists-all'],
    queryFn: () => api.getChecklists(),
  })

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.getPlans(),
  })

  if (isLoading) return <LoadingPage />

  return (
    <div className="p-6 space-y-5 max-w-screen-xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Changeover Checklists</h2>
          <p className="text-sm text-slate-500">{checklists.length} checklist{checklists.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="primary" onClick={() => setShowNew(true)}><Plus size={15} /> New Checklist</Button>
      </div>

      <UpcomingPanel checklists={allChecklists} plans={plans} onOpen={setSelectedId} />

      <div className="flex gap-3 pt-2 border-t border-slate-100">
        <Select value={filterLine} onChange={e => setFilterLine(e.target.value)} className="w-28">
          <option value="">All Lines</option>
          {LINES.map(l => <option key={l}>{l}</option>)}
        </Select>
        <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-40">
          <option value="">All Status</option>
          <option value="NOT_STARTED">Not Started</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </Select>
      </div>

      <div className="space-y-2">
        {checklists.length === 0 && (
          <div className="text-center py-16 text-slate-400 text-sm">No checklists found. Create one for your next changeover.</div>
        )}
        {checklists.map(cl => {
          const items = cl.items || []
          const done = items.filter(i => i.status === 'DONE' || i.status === 'NOT_APPLICABLE').length
          const delayed = items.filter(i => i.status === 'DELAYED').length
          const pct = items.length ? Math.round((done / items.length) * 100) : 0
          const days = daysUntil(cl.changeoverDate)

          return (
            <div key={cl.id} onClick={() => setSelectedId(cl.id)}
              className="bg-white border border-slate-200 rounded-lg px-5 py-4 hover:shadow-card-hover transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-navy-900 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {cl.lineId}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{cl.description}</p>
                    <p className="text-xs text-slate-500">{cl.buyer} • {cl.styleNumber} • {fmtDate(cl.changeoverDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {delayed > 0 && <Badge variant="red"><AlertCircle size={11} /> {delayed} delayed</Badge>}
                  {days !== null && <Badge variant={days <= 2 ? 'red' : days <= 5 ? 'amber' : 'teal'}>{days >= 0 ? `${days}d` : 'Past'}</Badge>}
                  <div className="w-32">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>{done}/{items.length}</span><span>{pct}%</span>
                    </div>
                    <Progress value={pct} color="auto" size="sm" />
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <ChecklistDetail checklistId={selectedId} open={!!selectedId} onClose={() => setSelectedId(null)} />
      <NewChecklistDialog open={showNew} onClose={() => setShowNew(false)} />
    </div>
  )
}

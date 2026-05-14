import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, ArrowRightLeft, AlertTriangle, CheckCircle2, Wrench } from 'lucide-react'
import { api } from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { LoadingPage } from '@/components/ui/spinner'
import { MACHINE_TYPES, MACHINE_COLORS, CONDITION_COLORS, LINES } from '@/lib/utils'

function ConditionBadge({ condition }) {
  const c = CONDITION_COLORS[condition] || CONDITION_COLORS.RUNNING
  return (
    <span className={c.badge}>
      <span className={`h-1.5 w-1.5 rounded-full inline-block ${c.dot}`} />
      {c.label}
    </span>
  )
}

function LineSummaryCards({ summary }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {summary.map(s => (
        <Card key={s.line}>
          <CardContent className="p-3">
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-navy-900">{s.line}</span>
              {s.issues > 0 && <AlertTriangle size={12} className="text-amber-500" />}
            </div>
            <p className="text-lg font-bold text-slate-700 font-mono">{s.total}</p>
            <p className="text-xs text-slate-400">{s.running} running{s.issues > 0 ? `, ${s.issues} issues` : ''}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(s.byType).slice(0, 3).map(([type, count]) => (
                <span key={type} className="text-xs px-1 py-0.5 rounded" style={{ background: `${MACHINE_COLORS[type]}20`, color: MACHINE_COLORS[type] }}>{type}:{count}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TransferDialog({ machine, open, onClose }) {
  const [form, setForm] = useState({ toLine: 'E1', reason: '', movedBy: '' })
  const qc = useQueryClient()

  const mut = useMutation({
    mutationFn: () => api.transferMachine(machine.id, form),
    onSuccess: () => { qc.invalidateQueries(['machines']); qc.invalidateQueries(['machinesummary']); onClose() },
  })

  if (!machine) return null
  return (
    <Dialog open={open} onClose={onClose} title={`Transfer ${machine.machineCode}`} size="sm">
      <div className="p-6 space-y-4">
        <div className="bg-slate-50 rounded-lg p-3 text-sm">
          <span className="text-slate-500">From:</span> <span className="font-medium">{machine.currentLine}</span>
        </div>
        <Select label="Transfer To *" value={form.toLine} onChange={e => setForm(f => ({ ...f, toLine: e.target.value }))}>
          {LINES.filter(l => l !== machine.currentLine).map(l => <option key={l}>{l}</option>)}
          <option value="STORE">STORE</option>
        </Select>
        <Textarea label="Reason" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={2} />
        <Input label="Moved By" value={form.movedBy} onChange={e => setForm(f => ({ ...f, movedBy: e.target.value }))} />
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending ? 'Transferring…' : 'Transfer Machine'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function RequirementCheckerDialog({ open, onClose }) {
  const { data: obs = [] } = useQuery({ queryKey: ['obs'], queryFn: api.getOBs })
  const [obId, setObId] = useState('')
  const [lineId, setLineId] = useState('E1')
  const [result, setResult] = useState(null)
  const [checking, setChecking] = useState(false)

  const check = async () => {
    if (!obId) return
    setChecking(true)
    try { setResult(await api.checkMachineReq(obId, lineId)) }
    catch (e) { alert(e.message) }
    finally { setChecking(false) }
  }

  const statusIcon = s => s === 'OK' ? '✅' : s === 'PARTIAL' ? '⚠️' : '❌'
  const statusColor = s => s === 'OK' ? 'text-emerald-700' : s === 'PARTIAL' ? 'text-amber-700' : 'text-red-700'

  return (
    <Dialog open={open} onClose={onClose} title="Machine Requirement Checker" size="md">
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Select label="Style OB" value={obId} onChange={e => setObId(e.target.value)}>
            <option value="">Select OB…</option>
            {obs.map(ob => <option key={ob.id} value={ob.id}>{ob.styleName}</option>)}
          </Select>
          <Select label="Target Line" value={lineId} onChange={e => setLineId(e.target.value)}>
            {LINES.map(l => <option key={l}>{l}</option>)}
          </Select>
        </div>
        <Button variant="primary" onClick={check} disabled={!obId || checking} className="w-full">
          {checking ? 'Checking…' : 'Check Requirements'}
        </Button>

        {result && (
          <div className="space-y-3">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                <th className="pb-2">Machine Type</th><th>Required</th><th>Available</th><th>Status</th>
              </tr></thead>
              <tbody>
                {result.checks.map(c => (
                  <tr key={c.machineType} className="border-b border-slate-100">
                    <td className="py-2">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: `${MACHINE_COLORS[c.machineType]}20`, color: MACHINE_COLORS[c.machineType] }}>{c.machineType}</span>
                    </td>
                    <td className="py-2 font-mono">{c.required}</td>
                    <td className="py-2 font-mono">{c.available}</td>
                    <td className={`py-2 font-medium text-xs ${statusColor(c.status)}`}>{statusIcon(c.status)} {c.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {result.alternatives.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-700 mb-2">Available on other lines:</p>
                {result.alternatives.map(m => (
                  <div key={m.id} className="text-xs text-blue-600">{m.machineCode} ({m.machineType}) — Line {m.currentLine}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  )
}

function AddMachineDialog({ open, onClose }) {
  const [form, setForm] = useState({ machineCode: '', machineType: 'SNLS', brand: '', currentLine: 'E1', workstationNo: '', condition: 'RUNNING', notes: '' })
  const qc = useQueryClient()
  const mut = useMutation({
    mutationFn: () => api.createMachine({ ...form, workstationNo: form.workstationNo ? Number(form.workstationNo) : null, attachments: [] }),
    onSuccess: () => { qc.invalidateQueries(['machines']); qc.invalidateQueries(['machinesummary']); onClose() },
  })

  return (
    <Dialog open={open} onClose={onClose} title="Add Machine" size="sm">
      <div className="p-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Machine Code *" value={form.machineCode} onChange={e => setForm(f => ({ ...f, machineCode: e.target.value.toUpperCase() }))} placeholder="SNLS-042" />
          <Select label="Machine Type *" value={form.machineType} onChange={e => setForm(f => ({ ...f, machineType: e.target.value }))}>
            {MACHINE_TYPES.map(t => <option key={t}>{t}</option>)}
          </Select>
          <Input label="Brand" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="Juki" />
          <Select label="Line" value={form.currentLine} onChange={e => setForm(f => ({ ...f, currentLine: e.target.value }))}>
            {LINES.map(l => <option key={l}>{l}</option>)}
            <option value="STORE">STORE</option>
          </Select>
          <Input label="Workstation #" type="number" value={form.workstationNo} onChange={e => setForm(f => ({ ...f, workstationNo: e.target.value }))} />
          <Select label="Condition" value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}>
            <option value="RUNNING">Running</option>
            <option value="NEEDS_MAINTENANCE">Needs Maintenance</option>
            <option value="BREAKDOWN">Breakdown</option>
            <option value="IN_REPAIR">In Repair</option>
          </Select>
        </div>
        <Textarea label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => mut.mutate()} disabled={!form.machineCode || mut.isPending}>
            {mut.isPending ? 'Adding…' : 'Add Machine'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

export default function MachineInventory() {
  const [search, setSearch] = useState('')
  const [filterLine, setFilterLine] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterCond, setFilterCond] = useState('')
  const [transferMachine, setTransferMachine] = useState(null)
  const [showRequirements, setShowRequirements] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const qc = useQueryClient()

  const { data: machines = [], isLoading } = useQuery({
    queryKey: ['machines', filterLine, filterType, filterCond, search],
    queryFn: () => api.getMachines({ line: filterLine, type: filterType, condition: filterCond, search }),
  })

  const { data: summary = [] } = useQuery({ queryKey: ['machinesummary'], queryFn: api.getMachineSummary })

  const condMut = useMutation({
    mutationFn: ({ id, condition }) => api.updateCondition(id, { condition }),
    onSuccess: () => qc.invalidateQueries(['machines']),
  })

  if (isLoading) return <LoadingPage />

  return (
    <div className="p-6 space-y-5 max-w-screen-xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Machine Inventory</h2>
          <p className="text-sm text-slate-500">{machines.length} machines</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowRequirements(true)}><Wrench size={15} /> Check Requirements</Button>
          <Button variant="primary" onClick={() => setShowAdd(true)}><Plus size={15} /> Add Machine</Button>
        </div>
      </div>

      {/* Summary cards */}
      <LineSummaryCards summary={summary} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search code or brand…"
            className="h-10 w-full pl-9 pr-4 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        <Select value={filterLine} onChange={e => setFilterLine(e.target.value)} className="w-28">
          <option value="">All Lines</option>
          {LINES.map(l => <option key={l}>{l}</option>)}
          <option value="STORE">STORE</option>
        </Select>
        <Select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-32">
          <option value="">All Types</option>
          {MACHINE_TYPES.map(t => <option key={t}>{t}</option>)}
        </Select>
        <Select value={filterCond} onChange={e => setFilterCond(e.target.value)} className="w-40">
          <option value="">All Conditions</option>
          <option value="RUNNING">Running</option>
          <option value="NEEDS_MAINTENANCE">Needs Maint.</option>
          <option value="BREAKDOWN">Breakdown</option>
          <option value="IN_REPAIR">In Repair</option>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-auto">
          <table className="w-full data-table">
            <thead><tr>
              <th>Code</th><th>Type</th><th>Brand</th><th>Line</th><th>Station</th><th>Condition</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {machines.map(m => (
                <tr key={m.id} className={m.condition === 'BREAKDOWN' ? 'bg-red-50/30' : m.condition === 'NEEDS_MAINTENANCE' ? 'bg-amber-50/30' : ''}>
                  <td className="font-mono font-medium">{m.machineCode}</td>
                  <td>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: `${MACHINE_COLORS[m.machineType]}20`, color: MACHINE_COLORS[m.machineType] }}>{m.machineType}</span>
                  </td>
                  <td className="text-slate-500">{m.brand || '—'}</td>
                  <td><Badge variant="teal">{m.currentLine}</Badge></td>
                  <td className="font-mono text-slate-500">{m.workstationNo ?? '—'}</td>
                  <td><ConditionBadge condition={m.condition} /></td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => setTransferMachine(m)} className="text-xs text-teal-600 hover:underline flex items-center gap-0.5">
                        <ArrowRightLeft size={11} /> Transfer
                      </button>
                      {m.condition !== 'RUNNING' && (
                        <button onClick={() => condMut.mutate({ id: m.id, condition: 'RUNNING' })} className="ml-2 text-xs text-emerald-600 hover:underline">
                          Mark OK
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {machines.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-slate-400">No machines found</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <TransferDialog machine={transferMachine} open={!!transferMachine} onClose={() => setTransferMachine(null)} />
      <RequirementCheckerDialog open={showRequirements} onClose={() => setShowRequirements(false)} />
      <AddMachineDialog open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  )
}

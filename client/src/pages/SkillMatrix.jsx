import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, Search, ArrowRightLeft } from 'lucide-react'
import { api } from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { LoadingPage } from '@/components/ui/spinner'
import { efficiencyBg, GRADE_COLORS, LINES, GRADES } from '@/lib/utils'

const LINE_OPTIONS = [{ value: 'ALL', label: 'All Lines' }, ...LINES.map(l => ({ value: l, label: `Line ${l}` }))]

function GradeBadge({ grade }) {
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${GRADE_COLORS[grade] || 'bg-slate-100 text-slate-600'}`}>{grade}</span>
}

function HeatmapCell({ eff }) {
  if (eff == null || eff === 0) return <td className="border border-slate-200 w-10 h-8 bg-slate-50" title="Not trained" />
  const pct = Math.round(eff * 100)
  return (
    <td className="border border-slate-200 w-10 h-8 text-center" style={{ background: efficiencyBg(eff) }} title={`${pct}%`}>
      <span className="text-xs font-mono font-medium text-slate-700">{pct}</span>
    </td>
  )
}

function WorkerRow({ worker, operations, showLine, onTransfer }) {
  return (
    <tr className="hover:bg-slate-50">
      <td className="sticky left-0 bg-white border-r border-slate-200 px-3 py-2 min-w-[160px] z-10">
        <div className="flex items-center justify-between gap-1">
          <div>
            <p className="text-xs font-medium text-slate-800 truncate max-w-[110px]">{worker.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs text-slate-400 font-mono">{worker.empNo}</span>
              <GradeBadge grade={worker.grade} />
            </div>
          </div>
          <button
            onClick={() => onTransfer(worker)}
            className="p-1 rounded hover:bg-teal-50 text-slate-400 hover:text-teal-600 transition-colors shrink-0"
            title="Transfer to another line"
          >
            <ArrowRightLeft size={12} />
          </button>
        </div>
        {showLine && worker.currentLine && (
          <Badge variant="teal" className="mt-1 text-xs">{worker.currentLine}</Badge>
        )}
      </td>
      {operations.map(op => (
        <HeatmapCell key={op} eff={worker.skills[op]} />
      ))}
    </tr>
  )
}

function TransferWorkerDialog({ worker, open, onClose }) {
  const [newLine, setNewLine] = useState(worker?.currentLine || 'E1')
  const qc = useQueryClient()

  const mut = useMutation({
    mutationFn: () => api.updateWorker(worker.id, { currentLine: newLine }),
    onSuccess: () => {
      // Invalidate all skill matrix, worker, and allocation queries to reflect change everywhere
      qc.invalidateQueries(['workers'])
      qc.invalidateQueries(['skillmatrix'])
      qc.invalidateQueries(['lineworkers'])
      qc.invalidateQueries(['plans'])
      qc.invalidateQueries(['dashboard'])
      onClose()
    },
  })

  if (!worker) return null

  return (
    <Dialog open={open} onClose={onClose} title={`Transfer Worker — ${worker.name}`} size="sm">
      <div className="p-6 space-y-4">
        <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-3">
          <div>
            <p className="text-sm font-medium text-slate-700">{worker.name}</p>
            <p className="text-xs text-slate-500">Emp: {worker.empNo} · Grade: {worker.grade}</p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-slate-500">
            <Badge variant="teal">{worker.currentLine || 'Unassigned'}</Badge>
            <ArrowRightLeft size={14} />
            <Badge variant="blue">{newLine}</Badge>
          </div>
        </div>

        <Select label="Transfer to Line *" value={newLine} onChange={e => setNewLine(e.target.value)}>
          <option value="">— Unassigned —</option>
          {LINES.map(l => (
            <option key={l} value={l} disabled={l === worker.currentLine}>
              {l}{l === worker.currentLine ? ' (current)' : ''}
            </option>
          ))}
        </Select>

        <p className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded p-2">
          This will update the worker's line assignment and reflect in the Allocation Planner and Dashboard immediately.
        </p>

        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => mut.mutate()}
            disabled={mut.isPending || newLine === worker.currentLine}
          >
            {mut.isPending ? 'Transferring…' : 'Confirm Transfer'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function UploadDialog({ open, onClose }) {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const qc = useQueryClient()

  const handleUpload = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setResult(null)
    try {
      const res = await api.uploadSkillMatrix(file)
      setResult(res)
      qc.invalidateQueries(['workers'])
      qc.invalidateQueries(['skillmatrix'])
    } catch (err) { alert(err.message) }
    finally { setUploading(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Upload Skill Matrix XLSX">
      <div className="p-6 space-y-4">
        <div className="bg-slate-50 rounded-lg p-4 text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-700">Expected Format:</p>
          <p>• One sheet per line — name each sheet E1, E2, E3… for auto line mapping</p>
          <p>• Row 7 = Headers: SLNO | EMP NO | NAME | DATE OF JOIN | GRADE | [op columns...]</p>
          <p>• Row 8+ = Worker data, operation cells = efficiency (0.0–1.0)</p>
        </div>
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
          <Upload className="mx-auto mb-3 text-slate-400" size={28} />
          <p className="text-sm font-medium text-slate-700 mb-1">{uploading ? 'Parsing & uploading…' : 'Select skill matrix XLSX'}</p>
          <label className="cursor-pointer">
            <span className="bg-teal-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">
              {uploading ? '⏳ Processing…' : 'Choose File'}
            </span>
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
        {result && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700">
            ✅ Imported {result.count} workers successfully
          </div>
        )}
      </div>
    </Dialog>
  )
}

function WorkerDirectory({ line, search, onTransfer }) {
  const { data: workers = [], isLoading } = useQuery({
    queryKey: ['workers', { line, search }],
    queryFn: () => api.getWorkers({ ...(line !== 'ALL' ? { line } : {}), search, active: 'true' }),
  })

  if (isLoading) return <LoadingPage />

  // Group by line when showing ALL
  const grouped = line === 'ALL'
    ? LINES.reduce((acc, l) => {
        const lw = workers.filter(w => w.currentLine === l)
        if (lw.length) acc[l] = lw
        return acc
      }, {})
    : null

  const WorkerTable = ({ rows }) => (
    <table className="w-full data-table">
      <thead><tr>
        <th>Name</th><th>Emp No</th><th>Grade</th>{line === 'ALL' && <th>Line</th>}<th>Skills</th><th>Joined</th><th>Transfer</th>
      </tr></thead>
      <tbody>
        {rows.map(w => {
          const topSkill = [...(w.skills || [])].sort((a, b) => b.efficiency - a.efficiency)[0]
          return (
            <tr key={w.id}>
              <td className="font-medium">{w.name}</td>
              <td className="font-mono text-slate-500">{w.empNo}</td>
              <td><GradeBadge grade={w.grade} /></td>
              {line === 'ALL' && <td><Badge variant="teal">{w.currentLine || '—'}</Badge></td>}
              <td>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-mono">{w.skills?.length || 0}</span>
                  {topSkill && <span className="text-xs text-slate-400 truncate max-w-[120px]">Best: {topSkill.operationName}</span>}
                </div>
              </td>
              <td className="text-slate-500 text-xs">{w.dateOfJoin ? new Date(w.dateOfJoin).toLocaleDateString('en-IN') : '—'}</td>
              <td>
                <button
                  onClick={() => onTransfer(w)}
                  className="flex items-center gap-1 text-xs text-teal-600 hover:underline"
                >
                  <ArrowRightLeft size={11} /> Transfer
                </button>
              </td>
            </tr>
          )
        })}
        {rows.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-slate-400">No workers found</td></tr>}
      </tbody>
    </table>
  )

  if (line === 'ALL' && !search) {
    return (
      <div className="space-y-6">
        <p className="text-xs text-slate-500 font-medium">{workers.length} total workers across all lines</p>
        {Object.entries(grouped).map(([l, lworkers]) => (
          <div key={l}>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-sm text-navy-900 bg-navy-900/10 px-2 py-0.5 rounded">Line {l}</span>
              <span className="text-xs text-slate-400">{lworkers.length} workers</span>
            </div>
            <WorkerTable rows={lworkers} />
          </div>
        ))}
      </div>
    )
  }

  return <WorkerTable rows={workers} />
}

function Heatmap({ lineId, onTransfer }) {
  const { data, isLoading } = useQuery({
    queryKey: ['skillmatrix', lineId],
    queryFn: () => api.getSkillMatrix(lineId),
    enabled: !!lineId,
  })

  if (isLoading) return <LoadingPage />
  if (!data) return null

  const { workers, operations } = data
  const showLine = lineId === 'ALL'

  return (
    <div>
      <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
        <span>Efficiency legend:</span>
        {[['≥80%','bg-emerald-100'],['60–79%','bg-amber-100'],['40–59%','bg-orange-100'],['<40%','bg-red-100'],['Untrained','bg-slate-50']].map(([l, bg]) => (
          <span key={l} className={`px-2 py-1 rounded ${bg}`}>{l}</span>
        ))}
        <span className="ml-2 text-teal-600 flex items-center gap-1"><ArrowRightLeft size={11} /> = click to transfer worker</span>
      </div>
      <div className="overflow-auto border border-slate-200 rounded-lg max-h-[60vh]">
        <table className="border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-white">
            <tr>
              <th className="sticky left-0 z-20 bg-white border-r border-b border-slate-200 px-3 py-2 text-left min-w-[160px] text-slate-600">
                Worker {showLine && '· Line'}
              </th>
              {operations.map(op => (
                <th key={op} className="border border-slate-200 p-1 text-center bg-slate-50"
                  style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', height: 80, minWidth: 40 }}>
                  <span className="text-xs text-slate-600 font-normal">{op}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {workers.map(w => (
              <WorkerRow key={w.id} worker={w} operations={operations} showLine={showLine} onTransfer={onTransfer} />
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400 mt-2">
        {workers.length} worker{workers.length !== 1 ? 's' : ''} × {operations.length} operations
        {lineId === 'ALL' ? ' across all lines' : ` on Line ${lineId}`}
      </p>
    </div>
  )
}

export default function SkillMatrix() {
  const [tab, setTab] = useState('heatmap')
  const [line, setLine] = useState('E1')
  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [transferWorker, setTransferWorker] = useState(null)

  return (
    <div className="p-6 space-y-5 max-w-screen-xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Skill Matrix</h2>
          <p className="text-sm text-slate-500">Operator efficiency map across all lines</p>
        </div>
        <Button variant="primary" onClick={() => setShowUpload(true)}><Upload size={15} /> Upload XLSX</Button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-200">
        {[['heatmap','Skill Heatmap'],['directory','Worker Directory']].map(([val, label]) => (
          <button key={val} onClick={() => setTab(val)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${tab === val ? 'text-teal-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-teal-600' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Select value={line} onChange={e => setLine(e.target.value)} className="w-36">
          {LINE_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
        {tab === 'directory' && (
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or emp no…"
              className="h-10 w-full pl-9 pr-4 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
        )}
        {line === 'ALL' && tab === 'heatmap' && (
          <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
            Showing all lines — heatmap may be wide
          </span>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          {tab === 'heatmap' && <Heatmap lineId={line} onTransfer={setTransferWorker} />}
          {tab === 'directory' && <WorkerDirectory line={line} search={search} onTransfer={setTransferWorker} />}
        </CardContent>
      </Card>

      <UploadDialog open={showUpload} onClose={() => setShowUpload(false)} />
      <TransferWorkerDialog
        worker={transferWorker}
        open={!!transferWorker}
        onClose={() => setTransferWorker(null)}
      />
    </div>
  )
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, Search, ChevronDown, Info } from 'lucide-react'
import { api } from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { LoadingPage } from '@/components/ui/spinner'
import { efficiencyBg, GRADE_COLORS, LINES, GRADES } from '@/lib/utils'

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

function WorkerRow({ worker, operations }) {
  return (
    <tr className="hover:bg-slate-50">
      <td className="sticky left-0 bg-white border-r border-slate-200 px-3 py-2 min-w-[140px] z-10">
        <p className="text-xs font-medium text-slate-800 truncate">{worker.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-xs text-slate-400 font-mono">{worker.empNo}</span>
          <GradeBadge grade={worker.grade} />
        </div>
      </td>
      {operations.map(op => (
        <HeatmapCell key={op} eff={worker.skills[op]} />
      ))}
    </tr>
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
          <p>• One sheet per line (name sheet E1, E2... for auto line mapping)</p>
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

function WorkerDirectory({ line, search }) {
  const { data: workers = [], isLoading } = useQuery({
    queryKey: ['workers', { line, search }],
    queryFn: () => api.getWorkers({ line, search, active: 'true' }),
  })

  if (isLoading) return <LoadingPage />

  return (
    <div className="overflow-auto">
      <table className="w-full data-table">
        <thead><tr>
          <th>Name</th><th>Emp No</th><th>Grade</th><th>Line</th><th>Skills</th><th>Joined</th>
        </tr></thead>
        <tbody>
          {workers.map(w => {
            const topSkill = [...(w.skills || [])].sort((a, b) => b.efficiency - a.efficiency)[0]
            return (
              <tr key={w.id}>
                <td className="font-medium">{w.name}</td>
                <td className="font-mono text-slate-500">{w.empNo}</td>
                <td><GradeBadge grade={w.grade} /></td>
                <td><Badge variant="teal">{w.currentLine || '—'}</Badge></td>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-mono">{w.skills?.length || 0}</span>
                    {topSkill && <span className="text-xs text-slate-400 truncate max-w-[120px]">Best: {topSkill.operationName}</span>}
                  </div>
                </td>
                <td className="text-slate-500 text-xs">{w.dateOfJoin ? new Date(w.dateOfJoin).toLocaleDateString('en-IN') : '—'}</td>
              </tr>
            )
          })}
          {workers.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-400">No workers found</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function Heatmap({ lineId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['skillmatrix', lineId],
    queryFn: () => api.getSkillMatrix(lineId),
    enabled: !!lineId,
  })

  if (!lineId) return <div className="text-center py-16 text-slate-400 text-sm">Select a line to view the skill heatmap</div>
  if (isLoading) return <LoadingPage />
  if (!data) return null

  const { workers, operations } = data

  return (
    <div>
      <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
        <span>Efficiency legend:</span>
        {[['≥80%','bg-emerald-100'],['60–79%','bg-amber-100'],['40–59%','bg-orange-100'],['<40%','bg-red-100'],['Untrained','bg-slate-50']].map(([l, bg]) => (
          <span key={l} className={`px-2 py-1 rounded ${bg}`}>{l}</span>
        ))}
      </div>
      <div className="overflow-auto border border-slate-200 rounded-lg max-h-[60vh]">
        <table className="border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-white">
            <tr>
              <th className="sticky left-0 z-20 bg-white border-r border-b border-slate-200 px-3 py-2 text-left min-w-[140px] text-slate-600">Worker</th>
              {operations.map(op => (
                <th key={op} className="border border-slate-200 p-1 text-center bg-slate-50" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', height: 80, minWidth: 40 }}>
                  <span className="text-xs text-slate-600 font-normal">{op}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {workers.map(w => <WorkerRow key={w.id} worker={w} operations={operations} />)}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400 mt-2">{workers.length} workers × {operations.length} operations on Line {lineId}</p>
    </div>
  )
}

export default function SkillMatrix() {
  const [tab, setTab] = useState('heatmap')
  const [line, setLine] = useState('E1')
  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)

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
        <Select value={line} onChange={e => setLine(e.target.value)} className="w-28">
          {LINES.map(l => <option key={l}>{l}</option>)}
        </Select>
        {tab === 'directory' && (
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or emp no…"
              className="h-10 w-full pl-9 pr-4 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          {tab === 'heatmap' && <Heatmap lineId={line} />}
          {tab === 'directory' && <WorkerDirectory line={line} search={search} />}
        </CardContent>
      </Card>

      <UploadDialog open={showUpload} onClose={() => setShowUpload(false)} />
    </div>
  )
}

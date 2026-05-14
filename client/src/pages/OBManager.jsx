import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Upload, Search, Copy, Trash2, Eye, ChevronDown, ChevronRight, Star, FileSpreadsheet } from 'lucide-react'
import { api } from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { LoadingPage } from '@/components/ui/spinner'
import { fmt, fmtDate, MACHINE_COLORS, BUYERS, MACHINE_TYPES, GRADES } from '@/lib/utils'

const EMPTY_OP = { slNo: '', description: '', machineType: 'SNLS', baseSAM: '', allowancePercent: 15, threadConsumption: '', isCritical: false, requiredGrade: '' }

function OBCard({ ob, onView, onDuplicate, onDelete }) {
  const machCounts = ob.operations?.reduce((acc, o) => { acc[o.machineType] = (acc[o.machineType] || 0) + 1; return acc }, {}) || {}
  return (
    <Card className="hover:shadow-card-hover transition-shadow cursor-pointer" onClick={() => onView(ob)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 text-sm truncate">{ob.styleName}</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">{ob.styleNumber}</p>
          </div>
          <div className="flex gap-1 ml-2 shrink-0" onClick={e => e.stopPropagation()}>
            <button onClick={() => onDuplicate(ob.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-teal-600 transition-colors"><Copy size={13} /></button>
            <button onClick={() => onDelete(ob.id)} className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={13} /></button>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="blue">{ob.buyer}</Badge>
          <span className="text-xs text-slate-400">{ob.totalOperations} ops</span>
          <span className="text-xs font-mono text-slate-600">{fmt(ob.totalSAM)} SAM</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {Object.entries(machCounts).slice(0, 5).map(([type, count]) => (
            <span key={type} className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${MACHINE_COLORS[type]}20`, color: MACHINE_COLORS[type] }}>
              {type} ×{count}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function OBDetailDialog({ ob, open, onClose }) {
  if (!ob) return null
  const criticals = ob.operations?.filter(o => o.isCritical) || []
  return (
    <Dialog open={open} onClose={onClose} title={`${ob.styleName} — OB Detail`} size="xl">
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Buyer', val: ob.buyer },
            { label: 'Style No', val: ob.styleNumber },
            { label: 'Total SAM', val: fmt(ob.totalSAM) },
            { label: 'Operations', val: ob.totalOperations },
          ].map(({ label, val }) => (
            <div key={label} className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="font-semibold text-slate-800 font-mono text-sm">{val}</p>
            </div>
          ))}
        </div>
        {criticals.length > 0 && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1"><Star size={12} /> Critical Operations ({criticals.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {criticals.map(o => <span key={o.id} className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">{o.description}</span>)}
            </div>
          </div>
        )}
        <div className="overflow-auto max-h-[50vh]">
          <table className="w-full data-table text-sm">
            <thead className="sticky top-0 z-10"><tr>
              <th className="w-10">#</th><th>Description</th><th>M/C</th>
              <th>Base SAM</th><th>Allow %</th><th>Total SAM</th><th>Thread(m)</th><th>Grade</th>
            </tr></thead>
            <tbody>
              {(ob.operations || []).map(op => (
                <tr key={op.id} className={op.isCritical ? 'bg-amber-50/50' : ''}>
                  <td className="font-mono text-slate-500">{op.slNo}</td>
                  <td className="font-medium">
                    {op.isCritical && <Star size={10} className="inline mr-1 text-amber-500" />}
                    {op.description}
                  </td>
                  <td><span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: `${MACHINE_COLORS[op.machineType]}20`, color: MACHINE_COLORS[op.machineType] }}>{op.machineType}</span></td>
                  <td className="font-mono">{fmt(op.baseSAM, 3)}</td>
                  <td className="font-mono">{op.allowancePercent}%</td>
                  <td className="font-mono font-medium">{fmt(op.totalSAM, 3)}</td>
                  <td className="font-mono">{op.threadConsumption != null ? fmt(op.threadConsumption, 2) : '—'}</td>
                  <td>{op.requiredGrade ? <Badge variant="purple">{op.requiredGrade}</Badge> : <span className="text-slate-300">—</span>}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-semibold">
                <td colSpan={3} className="px-4 py-2 text-xs">TOTAL</td>
                <td className="px-4 py-2 font-mono text-xs">{fmt(ob.operations?.reduce((s, o) => s + o.baseSAM, 0), 3)}</td>
                <td></td>
                <td className="px-4 py-2 font-mono text-xs text-teal-700">{fmt(ob.totalSAM, 3)}</td>
                <td className="px-4 py-2 font-mono text-xs">{fmt(ob.operations?.reduce((s, o) => s + (o.threadConsumption || 0), 0), 2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </Dialog>
  )
}

function NewOBDialog({ open, onClose, onSuccess }) {
  const [step, setStep] = useState(1)
  const [header, setHeader] = useState({ styleName: '', buyer: 'GAP', styleNumber: '' })
  const [ops, setOps] = useState([{ ...EMPTY_OP, slNo: 1 }])
  const [uploading, setUploading] = useState(false)
  const qc = useQueryClient()

  const createMut = useMutation({
    mutationFn: () => api.createOB({ ...header, operations: ops.map(o => ({ ...o, slNo: Number(o.slNo), baseSAM: Number(o.baseSAM), allowancePercent: Number(o.allowancePercent), threadConsumption: o.threadConsumption ? Number(o.threadConsumption) : null, totalSAM: Number((Number(o.baseSAM) * (1 + Number(o.allowancePercent) / 100)).toFixed(3)) })) }),
    onSuccess: () => { qc.invalidateQueries(['obs']); onClose(); setStep(1); setOps([{ ...EMPTY_OP, slNo: 1 }]); setHeader({ styleName: '', buyer: 'GAP', styleNumber: '' }) },
  })

  const handleUpload = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { operations } = await api.uploadOBXlsx(file)
      setOps(operations)
      setStep(2)
    } catch (err) { alert(err.message) }
    finally { setUploading(false) }
  }

  const addRow = () => setOps(o => [...o, { ...EMPTY_OP, slNo: o.length + 1 }])
  const removeRow = i => setOps(o => o.filter((_, j) => j !== i))
  const updateRow = (i, field, val) => setOps(o => { const n = [...o]; n[i] = { ...n[i], [field]: val }; return n })

  return (
    <Dialog open={open} onClose={onClose} title={step === 1 ? 'New OB — Details' : 'New OB — Operations'} size="xl">
      <div className="p-6">
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Style Name *" value={header.styleName} onChange={e => setHeader(h => ({ ...h, styleName: e.target.value }))} placeholder="Henley Short Sleeve" />
              <Select label="Buyer *" value={header.buyer} onChange={e => setHeader(h => ({ ...h, buyer: e.target.value }))}>
                {BUYERS.map(b => <option key={b}>{b}</option>)}
              </Select>
              <Input label="Style Number *" value={header.styleNumber} onChange={e => setHeader(h => ({ ...h, styleNumber: e.target.value }))} placeholder="D93965-907038" className="col-span-2" />
            </div>
            <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto mb-2 text-slate-400" size={24} />
              <p className="text-sm text-slate-600 font-medium mb-1">Upload OB from XLSX</p>
              <p className="text-xs text-slate-400 mb-3">Columns: SL#, Description, Machine Type, Base SAM, Allowance %, Thread</p>
              <label className="cursor-pointer">
                <span className="bg-teal-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-teal-700 transition-colors">{uploading ? 'Parsing…' : 'Choose XLSX file'}</span>
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>
            <div className="flex justify-between">
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={() => setStep(2)} disabled={!header.styleName || !header.styleNumber}>Next: Add Operations →</Button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <div className="overflow-auto max-h-[55vh]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr className="text-left">
                    {['#','Description','M/C','Base SAM','Allow %','Thread m','Critical','Grade',''].map(h => (
                      <th key={h} className="px-2 py-2 font-semibold text-slate-600 border-b border-slate-200">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ops.map((op, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="px-2 py-1 w-10"><input type="number" value={op.slNo} onChange={e => updateRow(i, 'slNo', e.target.value)} className="w-12 h-7 text-center border border-slate-200 rounded text-xs" /></td>
                      <td className="px-2 py-1"><input value={op.description} onChange={e => updateRow(i, 'description', e.target.value.toUpperCase())} className="w-48 h-7 border border-slate-200 rounded px-2 text-xs uppercase" /></td>
                      <td className="px-2 py-1">
                        <select value={op.machineType} onChange={e => updateRow(i, 'machineType', e.target.value)} className="h-7 border border-slate-200 rounded px-1 text-xs">
                          {MACHINE_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1"><input type="number" step="0.01" value={op.baseSAM} onChange={e => updateRow(i, 'baseSAM', e.target.value)} className="w-16 h-7 border border-slate-200 rounded px-2 text-xs text-right" /></td>
                      <td className="px-2 py-1"><input type="number" value={op.allowancePercent} onChange={e => updateRow(i, 'allowancePercent', e.target.value)} className="w-12 h-7 border border-slate-200 rounded px-2 text-xs text-right" /></td>
                      <td className="px-2 py-1"><input type="number" step="0.01" value={op.threadConsumption} onChange={e => updateRow(i, 'threadConsumption', e.target.value)} className="w-16 h-7 border border-slate-200 rounded px-2 text-xs text-right" /></td>
                      <td className="px-2 py-1 text-center"><input type="checkbox" checked={op.isCritical} onChange={e => updateRow(i, 'isCritical', e.target.checked)} className="h-4 w-4 accent-teal-600" /></td>
                      <td className="px-2 py-1">
                        <select value={op.requiredGrade} onChange={e => updateRow(i, 'requiredGrade', e.target.value)} className="h-7 border border-slate-200 rounded px-1 text-xs">
                          <option value="">—</option>
                          {GRADES.slice(0, 5).map(g => <option key={g}>{g}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1"><button onClick={() => removeRow(i)} className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 size={12} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={addRow}><Plus size={13} /> Add Row</Button>
                <span className="text-xs text-slate-500 self-center">{ops.length} ops | SAM {fmt(ops.reduce((s, o) => s + Number(o.baseSAM || 0) * (1 + Number(o.allowancePercent || 15) / 100), 0), 3)}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setStep(1)}>← Back</Button>
                <Button variant="primary" onClick={() => createMut.mutate()} disabled={createMut.isPending || ops.length === 0}>
                  {createMut.isPending ? 'Saving…' : 'Save OB'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  )
}

export default function OBManager() {
  const [search, setSearch] = useState('')
  const [buyer, setBuyer] = useState('')
  const [selectedOB, setSelectedOB] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const qc = useQueryClient()

  const { data: obs = [], isLoading } = useQuery({
    queryKey: ['obs', search, buyer],
    queryFn: () => api.getOBs({ search, buyer }),
  })

  const { data: detailOB } = useQuery({
    queryKey: ['ob', selectedOB?.id],
    queryFn: () => api.getOB(selectedOB.id),
    enabled: !!selectedOB,
  })

  const dupMut = useMutation({ mutationFn: api.duplicateOB, onSuccess: () => qc.invalidateQueries(['obs']) })
  const delMut = useMutation({ mutationFn: api.deleteOB, onSuccess: () => qc.invalidateQueries(['obs']) })

  const handleDelete = (id) => { if (confirm('Delete this OB?')) delMut.mutate(id) }

  if (isLoading) return <LoadingPage />

  return (
    <div className="p-6 space-y-5 max-w-screen-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">OB Library</h2>
          <p className="text-sm text-slate-500">{obs.length} style{obs.length !== 1 ? 's' : ''} saved</p>
        </div>
        <Button variant="primary" onClick={() => setShowNew(true)}><Plus size={15} /> New OB</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search style name or number…"
            className="h-10 w-full pl-9 pr-4 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        <Select value={buyer} onChange={e => setBuyer(e.target.value)} className="w-36">
          <option value="">All Buyers</option>
          {BUYERS.map(b => <option key={b}>{b}</option>)}
        </Select>
      </div>

      {/* Grid */}
      {obs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <FileSpreadsheet className="mx-auto mb-3 text-slate-300" size={40} />
          <p className="text-sm">No OBs found. Create your first OB to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {obs.map(ob => (
            <OBCard key={ob.id} ob={ob} onView={setSelectedOB} onDuplicate={id => dupMut.mutate(id)} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <OBDetailDialog ob={detailOB || selectedOB} open={!!selectedOB} onClose={() => setSelectedOB(null)} />
      <NewOBDialog open={showNew} onClose={() => setShowNew(false)} />
    </div>
  )
}

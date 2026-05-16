import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Upload, Search, Copy, Trash2, AlertOctagon, FileSpreadsheet } from 'lucide-react'
import { api } from '@/api/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { LoadingPage } from '@/components/ui/spinner'
import { fmt, MACHINE_COLORS, BUYERS, MACHINE_TYPES } from '@/lib/utils'

const SECTIONS = ['FRONT', 'BACK', 'SLEEVE', 'COLLAR', 'CUFF', 'ASSEMBLY', 'CENTRALIZED', 'AFTER WASH']

const SECTION_COLORS = {
  FRONT:        'bg-blue-100 text-blue-900 border-blue-300',
  BACK:         'bg-purple-100 text-purple-900 border-purple-300',
  SLEEVE:       'bg-cyan-100 text-cyan-900 border-cyan-300',
  COLLAR:       'bg-emerald-100 text-emerald-900 border-emerald-300',
  CUFF:         'bg-amber-100 text-amber-900 border-amber-300',
  ASSEMBLY:     'bg-orange-100 text-orange-900 border-orange-300',
  CENTRALIZED:  'bg-slate-200 text-slate-900 border-slate-400',
  'AFTER WASH': 'bg-pink-100 text-pink-900 border-pink-300',
}

const EMPTY_HEADER = {
  styleName: '', buyer: 'GAP', styleNumber: '',
  itemNo: '', orderQty: '', description: '', fabric: '', division: '', lineNo: '',
  taktTimeSec: '', output60: '', output100: '', outputPerHr: '',
  minPerDay: '', pcsPerMC: '', machineWS: '', nonMachineWS: '', totalWS: '',
}

const EMPTY_OP = {
  slNo: '', section: 'FRONT', description: '', machineType: 'SNLS',
  baseSAM: '', manualSAM: '', allowancePercent: 0,
  uncutThreadSources: '', machineLimitationOnUT: '', folderWorkaids: '',
  noOfMcCalculation: '', workstationsNo: '', perHr: '', perDay: '',
  needle: '', thread: '', spi: '', presserFoot: '', feedDog: '',
  spm: '', spring: '', needlePlate: '', model: '', criticalPoints: '', remarks: '',
  isCritical: false, requiredGrade: '',
}

const TCell = ({ value, onChange, type = 'text', className = '' }) => (
  <input
    type={type}
    value={value ?? ''}
    onChange={e => onChange(e.target.value)}
    className={`h-7 w-full border border-slate-200 rounded px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-400 ${className}`}
  />
)

const COL_GROUPS = [
  { label: '', cols: [{ key: 'slNo', label: 'SL.NO', w: 'w-10' }] },
  { label: '', cols: [{ key: 'description', label: 'OPERATION', w: 'w-44' }] },
  { label: '', cols: [{ key: 'baseSAM', label: 'MACHINE SAM', w: 'w-20' }] },
  { label: '', cols: [{ key: 'manualSAM', label: 'MANUAL SAM', w: 'w-20' }] },
  { label: '', cols: [{ key: 'machineType', label: 'MACHINE TYPE', w: 'w-28' }] },
  { label: '', cols: [{ key: 'uncutThreadSources', label: 'UNCUT THREAD SOURCES', w: 'w-28' }] },
  { label: '', cols: [{ key: 'machineLimitationOnUT', label: 'M/C LIMIT ON UT', w: 'w-20' }] },
  { label: '', cols: [{ key: 'folderWorkaids', label: 'FOLDER / WORKAIDS', w: 'w-28' }] },
  { label: '', cols: [{ key: 'noOfMcCalculation', label: 'NO. OF MC', w: 'w-16' }] },
  {
    label: 'TARGET @ 70%',
    cols: [
      { key: 'workstationsNo', label: 'WS NO.', w: 'w-14' },
      { key: 'perHr', label: 'PER HR', w: 'w-14' },
      { key: 'perDay', label: 'PER DAY', w: 'w-16' },
    ],
  },
  { label: '', cols: [{ key: 'needle', label: 'NEEDLE', w: 'w-24' }] },
  { label: '', cols: [{ key: 'thread', label: 'THREAD', w: 'w-28' }] },
  { label: '', cols: [{ key: 'spi', label: 'SPI', w: 'w-12' }] },
  { label: '', cols: [{ key: 'presserFoot', label: 'PRESSER FOOT', w: 'w-24' }] },
  { label: '', cols: [{ key: 'feedDog', label: 'FEED DOG', w: 'w-20' }] },
  { label: '', cols: [{ key: 'spm', label: 'SPM', w: 'w-16' }] },
  { label: '', cols: [{ key: 'spring', label: 'SPRING', w: 'w-24' }] },
  { label: '', cols: [{ key: 'needlePlate', label: 'NEEDLE PLATE', w: 'w-20' }] },
  { label: '', cols: [{ key: 'model', label: 'MODEL', w: 'w-16' }] },
  { label: '', cols: [{ key: 'criticalPoints', label: 'CRITICAL POINTS', w: 'w-32' }] },
  { label: '', cols: [{ key: 'remarks', label: 'REMARKS', w: 'w-24' }] },
]
const ALL_COLS = COL_GROUPS.flatMap(g => g.cols)
const TOTAL_COL_SPAN = ALL_COLS.length

function OBTableHeader({ withSection = false, withDelete = false }) {
  return (
    <thead className="sticky top-0 z-10 bg-slate-100 text-[10px] font-semibold text-slate-700 uppercase">
      <tr>
        {withSection && <th className="border border-slate-300 w-24" />}
        {COL_GROUPS.map((g, gi) =>
          g.label
            ? <th key={gi} colSpan={g.cols.length} className="border border-slate-300 px-1 py-1 text-center text-teal-700 bg-teal-50">{g.label}</th>
            : <th key={gi} className="border border-slate-300" />
        )}
        {withDelete && <th className="border border-slate-300" />}
      </tr>
      <tr>
        {withSection && <th className="border border-slate-300 px-1 py-1 text-center bg-slate-200">SECTION</th>}
        {ALL_COLS.map(c => (
          <th key={c.key} className={`border border-slate-300 px-1 py-1 text-center whitespace-nowrap ${c.w}`}>{c.label}</th>
        ))}
        {withDelete && <th className="border border-slate-300 w-8" />}
      </tr>
    </thead>
  )
}

function SectionBanner({ section, colSpan }) {
  const cls = SECTION_COLORS[section] || 'bg-slate-200 text-slate-900 border-slate-400'
  return (
    <tr>
      <td colSpan={colSpan} className={`border-y-2 ${cls} px-3 py-1.5 text-[11px] font-bold tracking-wide`}>
        {section} SECTION
      </td>
    </tr>
  )
}

function OBCard({ ob, onView, onDuplicate, onDelete }) {
  return (
    <Card className="hover:shadow-card-hover transition-shadow cursor-pointer" onClick={() => onView(ob)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 text-sm truncate">{ob.styleName}</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">{ob.styleNumber}</p>
          </div>
          <div className="flex gap-1 ml-2 shrink-0" onClick={e => e.stopPropagation()}>
            <button onClick={() => onDuplicate(ob.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-teal-600"><Copy size={13} /></button>
            <button onClick={() => onDelete(ob.id)} className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge variant="blue">{ob.buyer}</Badge>
          {ob.lineNo && <Badge variant="teal">Line {ob.lineNo}</Badge>}
          {ob.fabric && <span className="text-xs text-slate-500">{ob.fabric}</span>}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] uppercase text-slate-400">Ops</p>
            <p className="text-sm font-mono font-semibold text-slate-700">{ob.totalOperations}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-400">Total SAM</p>
            <p className="text-sm font-mono font-semibold text-slate-700">{fmt(ob.totalSAM)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-400">Takt (s)</p>
            <p className="text-sm font-mono font-semibold text-slate-700">{ob.taktTimeSec ?? '—'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function HeaderSummary({ ob }) {
  const cells = [
    ['Style No', ob.styleNumber],
    ['Buyer', ob.buyer],
    ['Item No', ob.itemNo],
    ['Order Qty', ob.orderQty],
    ['Division', ob.division],
    ['Line No', ob.lineNo],
    ['Fabric', ob.fabric],
    ['Takt (sec)', ob.taktTimeSec],
    ['Output @60%', ob.output60],
    ['Output @100%', ob.output100],
    ['Output / Hr (100%)', ob.outputPerHr],
    ['Min / Day', ob.minPerDay],
    ['PCS / MC', ob.pcsPerMC],
    ['M/C WS', ob.machineWS],
    ['Non-M/C WS', ob.nonMachineWS],
    ['Total WS', ob.totalWS],
    ['Total SAM (M/C)', fmt(ob.totalSAM, 2)],
    ['Total Manual SAM', ob.totalManualSAM != null ? fmt(ob.totalManualSAM, 2) : '—'],
  ].filter(([, v]) => v !== null && v !== undefined && v !== '')

  if (!cells.length) return null
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
      <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Technical Data Sheet</p>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-2">
        {cells.map(([label, val]) => (
          <div key={label}>
            <p className="text-[10px] uppercase text-slate-400">{label}</p>
            <p className="text-xs font-mono font-semibold text-slate-800">{val ?? '—'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function OBDetailDialog({ ob, open, onClose }) {
  if (!ob) return null
  const criticals = ob.operations?.filter(o => o.isCritical) || []

  // Group operations by section, preserving order
  const grouped = []
  let lastSection = undefined
  for (const op of ob.operations || []) {
    const sec = op.section || 'UNSECTIONED'
    if (sec !== lastSection) { grouped.push({ type: 'banner', section: sec }); lastSection = sec }
    grouped.push({ type: 'op', op })
  }

  return (
    <Dialog open={open} onClose={onClose} title={`${ob.styleName} — Operation Bulletin`} size="full">
      <div className="p-4">
        <HeaderSummary ob={ob} />

        {criticals.length > 0 && (
          <div className="mb-3 bg-red-50 border border-red-300 rounded-lg p-3">
            <p className="text-xs font-semibold text-red-800 mb-1.5 flex items-center gap-1.5">
              <AlertOctagon size={13} /> Critical Operations ({criticals.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {criticals.map(o => (
                <span key={o.id} className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded font-medium">
                  #{o.slNo} {o.description}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-auto max-h-[65vh] border border-slate-200 rounded-lg">
          <table className="text-[11px] border-collapse w-max min-w-full">
            <OBTableHeader />
            <tbody>
              {grouped.map((g, gi) => {
                if (g.type === 'banner') {
                  if (g.section === 'UNSECTIONED' && grouped.filter(x => x.type === 'banner').length === 1) return null
                  return <SectionBanner key={`b-${gi}`} section={g.section} colSpan={TOTAL_COL_SPAN} />
                }
                const op = g.op
                const rowCls = op.isCritical
                  ? 'bg-red-50 text-red-900 font-medium'
                  : (gi % 2 === 0 ? 'bg-white' : 'bg-slate-50')
                return (
                  <tr key={op.id} className={rowCls}>
                    {ALL_COLS.map(c => {
                      if (c.key === 'description') return (
                        <td key={c.key} className={`border border-slate-200 px-1.5 py-1 font-medium whitespace-nowrap ${op.isCritical ? 'text-red-800' : ''}`}>
                          {op.isCritical && <AlertOctagon size={10} className="inline mr-1 text-red-600" />}
                          {op.description}
                        </td>
                      )
                      if (c.key === 'machineType') return (
                        <td key={c.key} className="border border-slate-200 px-1.5 py-1 text-center">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                            style={{ background: `${MACHINE_COLORS[op.machineType] || '#94a3b8'}20`, color: MACHINE_COLORS[op.machineType] || '#475569' }}>
                            {op.machineType}
                          </span>
                        </td>
                      )
                      const val = op[c.key]
                      return (
                        <td key={c.key} className="border border-slate-200 px-1.5 py-1 text-center font-mono whitespace-nowrap">
                          {val != null && val !== '' ? val : <span className="text-slate-300">—</span>}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-semibold text-[10px]">
                <td className="border border-slate-300 px-1.5 py-1.5" />
                <td className="border border-slate-300 px-1.5 py-1.5 text-right">TOTAL SAM (M/C + Manual)</td>
                <td className="border border-slate-300 px-1.5 py-1.5 font-mono text-teal-700">{fmt(ob.totalSAM, 2)}</td>
                <td className="border border-slate-300 px-1.5 py-1.5 font-mono text-teal-700">{ob.totalManualSAM != null ? fmt(ob.totalManualSAM, 2) : '—'}</td>
                {ALL_COLS.slice(4).map(c => <td key={c.key} className="border border-slate-300" />)}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </Dialog>
  )
}

function HeaderForm({ header, setHeader }) {
  const f = (k, label, opts = {}) => (
    <Input label={label} value={header[k]} type={opts.type || 'text'}
      onChange={e => setHeader(h => ({ ...h, [k]: e.target.value }))}
      placeholder={opts.placeholder || ''} />
  )
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Input label="Style Name *" value={header.styleName} onChange={e => setHeader(h => ({ ...h, styleName: e.target.value }))} className="col-span-2 md:col-span-3" />
        <Select label="Buyer *" value={header.buyer} onChange={e => setHeader(h => ({ ...h, buyer: e.target.value }))}>
          {BUYERS.map(b => <option key={b}>{b}</option>)}
        </Select>
        {f('styleNumber', 'Style Number *')}
        {f('itemNo', 'Item No')}
        {f('orderQty', 'Order Qty', { type: 'number' })}
        {f('division', 'Division', { placeholder: 'SHIRT / KNITS' })}
        {f('lineNo', 'Line No')}
        {f('fabric', 'Fabric', { placeholder: 'Denim / Single Jersey' })}
        {f('description', 'Description', { placeholder: 'RELAXED BOXY BUTTON DOWN' })}
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Production Targets</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {f('taktTimeSec', 'Takt Time (sec)', { type: 'number' })}
          {f('output60', 'Output @ 60%', { type: 'number' })}
          {f('output100', 'Output @ 100%', { type: 'number' })}
          {f('outputPerHr', 'Output / Hr (100%)', { type: 'number' })}
          {f('minPerDay', 'Min / Day', { type: 'number' })}
          {f('pcsPerMC', 'PCS / MC', { type: 'number' })}
          {f('machineWS', 'M/C WS', { type: 'number' })}
          {f('nonMachineWS', 'Non-M/C WS', { type: 'number' })}
          {f('totalWS', 'Total WS', { type: 'number' })}
        </div>
      </div>
    </div>
  )
}

function NewOBDialog({ open, onClose }) {
  const [step, setStep] = useState(1)
  const [header, setHeader] = useState(EMPTY_HEADER)
  const [ops, setOps] = useState([{ ...EMPTY_OP, slNo: 1 }])
  const [uploading, setUploading] = useState(false)
  const qc = useQueryClient()

  const reset = () => { setStep(1); setHeader(EMPTY_HEADER); setOps([{ ...EMPTY_OP, slNo: 1 }]) }
  const onCloseReset = () => { reset(); onClose() }

  const createMut = useMutation({
    mutationFn: () => api.createOB({
      ...header,
      operations: ops.map(o => ({
        ...o,
        slNo: Number(o.slNo) || 1,
        baseSAM: Number(o.baseSAM) || 0,
        manualSAM: o.manualSAM !== '' && o.manualSAM != null ? Number(o.manualSAM) : null,
        allowancePercent: Number(o.allowancePercent) || 0,
        totalSAM: parseFloat(((Number(o.baseSAM) || 0) + (Number(o.manualSAM) || 0)).toFixed(3)),
        noOfMcCalculation: o.noOfMcCalculation !== '' ? Number(o.noOfMcCalculation) : null,
        workstationsNo: o.workstationsNo !== '' ? Number(o.workstationsNo) : null,
        perHr: o.perHr !== '' ? Number(o.perHr) : null,
        perDay: o.perDay !== '' ? Number(o.perDay) : null,
        spi: o.spi !== '' ? Number(o.spi) : null,
        spm: o.spm !== '' ? Number(o.spm) : null,
        isCritical: !!o.isCritical || !!String(o.criticalPoints || '').trim(),
      })),
    }),
    onSuccess: () => { qc.invalidateQueries(['obs']); onCloseReset() },
  })

  const handleUpload = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await api.uploadOBXlsx(file)
      if (result.header) {
        setHeader(h => ({
          ...h,
          ...Object.fromEntries(Object.entries(result.header).filter(([, v]) => v !== null && v !== undefined && v !== '')),
        }))
      }
      setOps(result.operations.map(op => ({
        ...EMPTY_OP, ...op,
        section: op.section || 'FRONT',
        manualSAM: op.manualSAM ?? '',
        noOfMcCalculation: op.noOfMcCalculation ?? '',
        workstationsNo: op.workstationsNo ?? '',
        perHr: op.perHr ?? '', perDay: op.perDay ?? '',
        spi: op.spi ?? '', spm: op.spm ?? '',
        uncutThreadSources: op.uncutThreadSources ?? '',
        machineLimitationOnUT: op.machineLimitationOnUT ?? '',
        folderWorkaids: op.folderWorkaids ?? '',
        needle: op.needle ?? '', thread: op.thread ?? '',
        presserFoot: op.presserFoot ?? '', feedDog: op.feedDog ?? '',
        spring: op.spring ?? '', needlePlate: op.needlePlate ?? '',
        model: op.model ?? '', criticalPoints: op.criticalPoints ?? '',
        remarks: op.remarks ?? '',
      })))
      setStep(2)
    } catch (err) { alert(err.message) }
    finally { setUploading(false) }
  }

  const addRow = () => setOps(o => [...o, { ...EMPTY_OP, slNo: o.length + 1, section: o[o.length - 1]?.section || 'FRONT' }])
  const removeRow = i => setOps(o => o.filter((_, j) => j !== i))
  const updateRow = (i, field, val) => setOps(o => { const n = [...o]; n[i] = { ...n[i], [field]: val }; return n })

  const NUM_FIELDS = new Set(['slNo', 'baseSAM', 'manualSAM', 'noOfMcCalculation', 'workstationsNo', 'perHr', 'perDay', 'spi', 'spm'])

  return (
    <Dialog open={open} onClose={onCloseReset} title={step === 1 ? 'New OB — Technical Data Sheet' : 'New OB — Operations'} size="full">
      <div className="p-5">
        {step === 1 && (
          <div className="space-y-5">
            <HeaderForm header={header} setHeader={setHeader} />

            <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto mb-2 text-slate-400" size={24} />
              <p className="text-sm text-slate-600 font-medium mb-1">Upload Operation Bulletin XLSX</p>
              <p className="text-xs text-slate-400 mb-3">Detects TDS format with section bands (FRONT, BACK, SLEEVE, COLLAR, CUFF, ASSEMBLY, CENTRALIZED, AFTER WASH). Header metadata is auto-extracted.</p>
              <label className="cursor-pointer">
                <span className="bg-teal-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-teal-700 transition-colors">{uploading ? 'Parsing…' : 'Choose XLSX file'}</span>
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>

            <div className="flex justify-between">
              <Button variant="secondary" onClick={onCloseReset}>Cancel</Button>
              <Button variant="primary" onClick={() => setStep(2)} disabled={!header.styleName || !header.styleNumber}>Next: Add Operations →</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="overflow-auto max-h-[65vh] border border-slate-200 rounded-lg">
              <table className="text-xs border-collapse w-max">
                <OBTableHeader withSection withDelete />
                <tbody>
                  {ops.map((op, i) => (
                    <tr key={i} className={op.isCritical || op.criticalPoints ? 'bg-red-50' : (i % 2 === 0 ? 'bg-white' : 'bg-slate-50')}>
                      <td className="border border-slate-200 px-0.5 py-0.5 w-24">
                        <select value={op.section || 'FRONT'} onChange={e => updateRow(i, 'section', e.target.value)}
                          className="h-7 w-full border border-slate-200 rounded px-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-400">
                          {SECTIONS.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      {ALL_COLS.map(c => {
                        if (c.key === 'machineType') return (
                          <td key={c.key} className={`border border-slate-200 px-0.5 py-0.5 ${c.w}`}>
                            <select value={op.machineType} onChange={e => updateRow(i, 'machineType', e.target.value)}
                              className="h-7 w-full border border-slate-200 rounded px-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-400">
                              {MACHINE_TYPES.map(t => <option key={t}>{t}</option>)}
                              {!MACHINE_TYPES.includes(op.machineType) && op.machineType && <option key={op.machineType}>{op.machineType}</option>}
                            </select>
                          </td>
                        )
                        return (
                          <td key={c.key} className={`border border-slate-200 px-0.5 py-0.5 ${c.w}`}>
                            <TCell type={NUM_FIELDS.has(c.key) ? 'number' : 'text'} value={op[c.key]} onChange={val => updateRow(i, c.key, val)} />
                          </td>
                        )
                      })}
                      <td className="border border-slate-200 px-0.5 py-0.5 w-8 text-center">
                        <button onClick={() => removeRow(i)} className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 size={11} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex gap-2 items-center">
                <Button variant="secondary" size="sm" onClick={addRow}><Plus size={13} /> Add Row</Button>
                <span className="text-xs text-slate-500">
                  {ops.length} ops | M/C SAM {fmt(ops.reduce((s, o) => s + (Number(o.baseSAM) || 0), 0), 2)} | Manual {fmt(ops.reduce((s, o) => s + (Number(o.manualSAM) || 0), 0), 2)}
                </span>
                <span className="text-xs text-red-600 flex items-center gap-1">
                  <AlertOctagon size={11} /> {ops.filter(o => o.isCritical || o.criticalPoints).length} critical
                </span>
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

  const handleDelete = id => { if (confirm('Delete this OB?')) delMut.mutate(id) }

  if (isLoading) return <LoadingPage />

  return (
    <div className="p-6 space-y-5 max-w-screen-xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">OB Library</h2>
          <p className="text-sm text-slate-500">{obs.length} style{obs.length !== 1 ? 's' : ''} saved</p>
        </div>
        <Button variant="primary" onClick={() => setShowNew(true)}><Plus size={15} /> New OB</Button>
      </div>

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

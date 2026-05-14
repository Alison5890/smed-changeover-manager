import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function fmt(n, decimals = 3) {
  return typeof n === 'number' ? n.toFixed(decimals) : '—'
}

export function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function daysUntil(d) {
  if (!d) return null
  const diff = Math.ceil((new Date(d) - Date.now()) / 86400000)
  return diff
}

export function efficiencyColor(eff) {
  if (!eff || eff === 0) return 'bg-slate-100 text-slate-400'
  if (eff >= 0.8) return 'bg-emerald-100 text-emerald-800'
  if (eff >= 0.6) return 'bg-amber-100 text-amber-800'
  if (eff >= 0.4) return 'bg-orange-100 text-orange-800'
  return 'bg-red-100 text-red-800'
}

export function efficiencyBg(eff) {
  if (!eff || eff === 0) return '#f1f5f9'
  if (eff >= 0.8) return '#dcfce7'
  if (eff >= 0.6) return '#fef3c7'
  if (eff >= 0.4) return '#ffedd5'
  return '#fee2e2'
}

export const GRADE_COLORS = {
  'A*':      'bg-purple-100 text-purple-800',
  'A+':      'bg-blue-100 text-blue-800',
  'A':       'bg-teal-100 text-teal-800',
  'B':       'bg-slate-100 text-slate-700',
  'C':       'bg-gray-100 text-gray-600',
  'FLOATER': 'bg-orange-100 text-orange-700',
}

export const MACHINE_COLORS = {
  'SNLS':     '#3b82f6',
  '4TH O/L':  '#8b5cf6',
  'F/L(2T)':  '#06b6d4',
  'F/L(3T)':  '#10b981',
  'HT':       '#f59e0b',
  'BH':       '#ef4444',
  'BT':       '#ec4899',
  'KANSAI':   '#f97316',
  'DNLS':     '#6366f1',
  'HAND':     '#94a3b8',
}

export const CONDITION_COLORS = {
  RUNNING:           { dot: 'bg-emerald-500', badge: 'badge-green',  label: 'Running' },
  NEEDS_MAINTENANCE: { dot: 'bg-amber-500',   badge: 'badge-amber',  label: 'Needs Maint.' },
  BREAKDOWN:         { dot: 'bg-red-500',     badge: 'badge-red',    label: 'Breakdown' },
  IN_REPAIR:         { dot: 'bg-orange-500',  badge: 'badge-amber',  label: 'In Repair' },
}

export const STATUS_COLORS = {
  DRAFT:       'badge-slate',
  CONFIRMED:   'badge-blue',
  ACTIVE:      'badge-green',
  COMPLETED:   'bg-slate-50 text-slate-400 border border-slate-200 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
  NOT_STARTED: 'badge-slate',
  IN_PROGRESS: 'badge-amber',
  PENDING:     'badge-slate',
  DONE:        'badge-green',
  DELAYED:     'badge-red',
  NOT_APPLICABLE: 'badge-slate',
}

export const LINES = ['E1','E2','E3','E4','E5','E6','E7','E8','E9','E10']
export const MACHINE_TYPES = ['SNLS','4TH O/L','F/L(2T)','F/L(3T)','HT','BH','BT','KANSAI','DNLS','HAND']
export const GRADES = ['A*','A+','A','B','C','FLOATER']
export const BUYERS = ['GAP','Hugo Boss','Marks & Spencer','Next','Primark','H&M']

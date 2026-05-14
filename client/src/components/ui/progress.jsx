import { cn } from '@/lib/utils'

export function Progress({ value = 0, className, color = 'teal', showLabel = false, size = 'md' }) {
  const colors = {
    teal:   'bg-teal-600',
    green:  'bg-emerald-500',
    amber:  'bg-amber-500',
    red:    'bg-red-500',
    auto: value >= 80 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-500',
  }
  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 bg-slate-100 rounded-full overflow-hidden', heights[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colors[color] || colors.teal)}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {showLabel && <span className="text-xs font-mono text-slate-600 w-9 text-right">{Math.round(value)}%</span>}
    </div>
  )
}

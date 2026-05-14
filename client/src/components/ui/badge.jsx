import { cn } from '@/lib/utils'

const variants = {
  default:  'bg-slate-100 text-slate-700',
  green:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  amber:    'bg-amber-50 text-amber-700 border border-amber-200',
  red:      'bg-red-50 text-red-700 border border-red-200',
  blue:     'bg-blue-50 text-blue-700 border border-blue-200',
  purple:   'bg-purple-50 text-purple-700 border border-purple-200',
  teal:     'bg-teal-50 text-teal-700 border border-teal-200',
}

export function Badge({ variant = 'default', className, children, ...props }) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', variants[variant], className)} {...props}>
      {children}
    </span>
  )
}

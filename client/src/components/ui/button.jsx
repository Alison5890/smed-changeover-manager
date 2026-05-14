import { cn } from '@/lib/utils'

const variants = {
  default:   'bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-950',
  primary:   'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:bg-slate-100',
  danger:    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  ghost:     'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200',
  outline:   'border border-teal-600 text-teal-600 hover:bg-teal-50 active:bg-teal-100',
}
const sizes = {
  sm:   'h-8 px-3 text-xs gap-1.5',
  md:   'h-10 px-4 text-sm gap-2',
  lg:   'h-12 px-6 text-base gap-2',
  icon: 'h-9 w-9 p-0',
}

export function Button({ variant = 'default', size = 'md', className, children, disabled, ...props }) {
  return (
    <button
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
        'disabled:opacity-50 disabled:pointer-events-none',
        variants[variant], sizes[size], className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

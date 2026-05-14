import { cn } from '@/lib/utils'

export function Textarea({ className, label, error, rows = 3, ...props }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-xs font-medium text-slate-600">{label}</label>}
      <textarea
        rows={rows}
        className={cn(
          'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800',
          'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none',
          error && 'border-red-400',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

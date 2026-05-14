import { cn } from '@/lib/utils'

export function Tabs({ value, onChange, tabs, className }) {
  return (
    <div className={cn('flex gap-1 border-b border-slate-200', className)}>
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'px-4 py-2.5 text-sm font-medium transition-colors relative',
            value === tab.value
              ? 'text-teal-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-teal-600'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn('ml-1.5 text-xs px-1.5 py-0.5 rounded-full', value === tab.value ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-600')}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

import { cn } from '@/lib/utils'

export function Spinner({ size = 'md', className }) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-6 w-6 border-2', lg: 'h-10 w-10 border-3' }
  return (
    <div className={cn('animate-spin rounded-full border-slate-200 border-t-teal-600', sizes[size], className)} />
  )
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  )
}

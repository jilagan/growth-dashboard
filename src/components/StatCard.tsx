import { cn } from '@/lib/utils'

interface Props {
  label: string
  value: string | number
  sub?: string
  color?: string
  trend?: 'up' | 'down' | 'neutral'
}

export default function StatCard({ label, value, sub, color = 'text-gray-900', trend }: Props) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">{label}</div>
      <div className={cn('text-3xl font-bold leading-tight', color)}>{value}</div>
      {sub && (
        <div className={cn(
          'text-[11px] mt-0.5',
          trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-gray-400',
        )}>
          {trend === 'up' && '↑ '}
          {trend === 'down' && '↓ '}
          {sub}
        </div>
      )}
    </div>
  )
}

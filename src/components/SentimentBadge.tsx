import { cn } from '@/lib/utils'

interface Props {
  sentiment: 'positive' | 'neutral' | 'negative' | null | undefined
  size?: 'sm' | 'md'
}

const CONFIG = {
  positive: { label: 'Positive', classes: 'bg-green-100 text-green-700' },
  neutral:  { label: 'Neutral',  classes: 'bg-gray-100 text-gray-600' },
  negative: { label: 'Negative', classes: 'bg-red-100 text-red-600' },
}

export default function SentimentBadge({ sentiment, size = 'sm' }: Props) {
  if (!sentiment) return null
  const cfg = CONFIG[sentiment]
  return (
    <span className={cn(
      'inline-block font-semibold rounded-full',
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
      cfg.classes,
    )}>
      {cfg.label}
    </span>
  )
}

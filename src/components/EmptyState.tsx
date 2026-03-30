import { Database } from 'lucide-react'

interface Props {
  title: string
  description: string
}

export default function EmptyState({ title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Database size={32} className="text-gray-300 mb-3" />
      <div className="text-gray-500 font-medium">{title}</div>
      <div className="text-gray-400 text-sm mt-1 max-w-xs">{description}</div>
    </div>
  )
}

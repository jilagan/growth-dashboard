interface Props {
  title: string
  subtitle?: string
  updatedAt?: string
  children?: React.ReactNode
}

export default function PageHeader({ title, subtitle, updatedAt, children }: Props) {
  return (
    <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 bg-white sticky top-0 z-10">
      <div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {updatedAt && (
          <span className="text-[11px] text-gray-400 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Updated {new Date(updatedAt).toLocaleTimeString()}
          </span>
        )}
        {children}
      </div>
    </div>
  )
}

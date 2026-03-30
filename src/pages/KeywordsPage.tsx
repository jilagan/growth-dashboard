import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import EmptyState from '@/components/EmptyState'
import { useGrowthData } from '@/hooks/useGrowthData'
import { APP_LABELS, APP_COLORS } from '@/lib/utils'

function RankDelta({ curr, prev }: { curr: number | null; prev: number | null }) {
  if (curr == null) return <span className="text-gray-300">—</span>
  if (prev == null) return <span className="text-blue-500 text-xs font-semibold">NEW #{curr}</span>
  const delta = prev - curr
  if (delta > 0) return (
    <span className="flex items-center gap-0.5 text-green-600 text-xs font-semibold">
      <TrendingUp size={12} /> +{delta}
    </span>
  )
  if (delta < 0) return (
    <span className="flex items-center gap-0.5 text-red-500 text-xs font-semibold">
      <TrendingDown size={12} /> {delta}
    </span>
  )
  return <span className="flex items-center gap-0.5 text-gray-400 text-xs"><Minus size={12} /> —</span>
}

const VOLUME_STYLES: Record<string, string> = {
  high:   'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low:    'bg-gray-100 text-gray-500',
}

export default function KeywordsPage() {
  const { data, loading, error } = useGrowthData()
  const navigate = useNavigate()
  const [appFilter, setAppFilter] = useState<string>('all')

  if (error === 'UNAUTHORIZED') { navigate('/login', { replace: true }); return null }
  if (loading) return <div className="p-6 animate-pulse"><div className="h-64 bg-gray-100 rounded-xl" /></div>
  if (error) return <div className="p-6"><div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 text-sm">{error}</div></div>

  const { keywords, updatedAt } = data!
  const { latest } = keywords

  const filtered = appFilter === 'all' ? latest : latest.filter(k => k.app_name === appFilter)

  // Sort: improved first, then new, then declined, then no change
  const sorted = [...filtered].sort((a, b) => {
    const da = a.prev_rank != null && a.rank != null ? a.prev_rank - a.rank : -999
    const db = b.prev_rank != null && b.rank != null ? b.prev_rank - b.rank : -999
    return db - da
  })

  return (
    <div>
      <PageHeader title="ASO Keywords" subtitle="App Store keyword rank tracking" updatedAt={updatedAt} />

      <div className="p-6 space-y-5">
        {latest.length === 0 ? (
          <EmptyState
            title="No keyword rankings yet"
            description="The monitoring agent will track keyword ranks weekly. Add target keywords to the keyword_rankings table to start."
          />
        ) : (
          <>
            {/* Filters */}
            <div className="flex gap-2 items-center">
              <select value={appFilter} onChange={e => setAppFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white outline-none focus:border-blue-500">
                <option value="all">All apps</option>
                <option value="kanji_mentor">Kanji Mentor</option>
                <option value="kiku_mentor">Kiku Mentor</option>
                <option value="yomu_mentor">Yomu Mentor</option>
              </select>
              <span className="text-xs text-gray-400">{sorted.length} keywords</span>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Keyword</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">App</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Current Rank</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Change</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(k => (
                    <tr key={k.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{k.keyword}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium" style={{ color: APP_COLORS[k.app_name] ?? '#64748b' }}>
                          {APP_LABELS[k.app_name] ?? k.app_name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {k.rank != null
                          ? <span className="text-sm font-bold text-gray-800">#{k.rank}</span>
                          : <span className="text-gray-300 text-xs">Not ranked</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <RankDelta curr={k.rank} prev={k.prev_rank} />
                      </td>
                      <td className="px-4 py-3">
                        {k.search_volume_estimate
                          ? <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${VOLUME_STYLES[k.search_volume_estimate] ?? 'bg-gray-100 text-gray-500'}`}>
                              {k.search_volume_estimate}
                            </span>
                          : <span className="text-gray-300 text-xs">—</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

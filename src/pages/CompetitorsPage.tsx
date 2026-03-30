import { useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import PageHeader from '@/components/PageHeader'
import EmptyState from '@/components/EmptyState'
import { useGrowthData } from '@/hooks/useGrowthData'
import { fmtDate } from '@/lib/utils'

const COMP_COLORS: Record<string, string> = {
  WaniKani: '#ff6b35',
  Duolingo: '#58cc02',
  Anki: '#1cb0f6',
  Renshuu: '#9b59b6',
  'Kanji Mentor': '#ef4444',
  'Kiku Mentor': '#6366f1',
  'Yomu Mentor': '#14b8a6',
}

export default function CompetitorsPage() {
  const { data, loading, error } = useGrowthData()
  const navigate = useNavigate()

  if (error === 'UNAUTHORIZED') { navigate('/login', { replace: true }); return null }
  if (loading) return <div className="p-6 animate-pulse space-y-4"><div className="h-48 bg-gray-100 rounded-xl" /><div className="h-64 bg-gray-100 rounded-xl" /></div>
  if (error) return <div className="p-6"><div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 text-sm">{error}</div></div>

  const { competitors, updatedAt } = data!
  const { snapshots, latest } = competitors
  const apps = Object.keys(latest)

  // Build time-series for rating comparison
  const timeMap: Record<string, Record<string, number>> = {}
  for (const s of snapshots) {
    const date = s.captured_at.slice(0, 10)
    if (!timeMap[date]) timeMap[date] = {}
    if (s.avg_rating != null) timeMap[date][s.app_name] = s.avg_rating
  }
  const chartData = Object.entries(timeMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({
      date: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ...vals,
    }))

  const allAppNames = [...new Set(snapshots.map(s => s.app_name))]

  return (
    <div>
      <PageHeader title="Competitors" subtitle="Ratings, ranks & version tracking" updatedAt={updatedAt} />

      <div className="p-6 space-y-5">
        {apps.length === 0 ? (
          <EmptyState
            title="No competitor data yet"
            description="The monitoring agent will populate this weekly via iTunes lookup & App Store search."
          />
        ) : (
          <>
            {/* Latest snapshot cards */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3">Latest Snapshots</div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {apps.map(name => {
                  const s = latest[name]
                  return (
                    <div key={name} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: COMP_COLORS[name] ?? '#94a3b8' }} />
                        <span className="text-xs font-semibold text-gray-700">{name}</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-800">
                        {s.avg_rating != null ? s.avg_rating.toFixed(1) : '—'}
                        <span className="text-sm font-normal text-yellow-400"> ★</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {s.rating_count != null ? `${s.rating_count.toLocaleString()} ratings` : '—'}
                      </div>
                      {s.version && <div className="text-[10px] text-gray-400 mt-0.5">v{s.version}</div>}
                      {s.category_rank && (
                        <div className="text-[10px] text-blue-500 mt-0.5">#{s.category_rank} in Education</div>
                      )}
                      <div className="text-[10px] text-gray-300 mt-1">{fmtDate(s.captured_at)}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Rating trend chart */}
            {chartData.length > 1 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="text-sm font-semibold text-gray-700 mb-4">Rating Trends</div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[3, 5]} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {allAppNames.map(name => (
                      <Line key={name} type="monotone" dataKey={name}
                        stroke={COMP_COLORS[name] ?? '#94a3b8'} strokeWidth={2} dot={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Comparison table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-700">Competitor Table</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['App', 'Rating', '# Ratings', 'Category Rank', 'Version', 'Last Updated'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {apps.map(name => {
                    const s = latest[name]
                    return (
                      <tr key={name} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: COMP_COLORS[name] ?? '#94a3b8' }} />
                            <span className="font-medium text-xs text-gray-700">{name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-yellow-500">
                          {s.avg_rating != null ? `${s.avg_rating.toFixed(1)} ★` : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {s.rating_count != null ? s.rating_count.toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {s.category_rank != null ? `#${s.category_rank}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{s.version ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(s.captured_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

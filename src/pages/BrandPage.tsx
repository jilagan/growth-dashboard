import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { ExternalLink } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import SentimentBadge from '@/components/SentimentBadge'
import EmptyState from '@/components/EmptyState'
import { useGrowthData } from '@/hooks/useGrowthData'
import { fmtRelative, APP_LABELS, APP_COLORS } from '@/lib/utils'

const SENTIMENT_COLORS = { positive: '#22c55e', neutral: '#94a3b8', negative: '#ef4444' }

const SOURCE_LABELS: Record<string, string> = {
  reddit: 'Reddit',
  twitter: 'Twitter/X',
  app_store_review: 'App Store',
  discord: 'Discord',
  other: 'Other',
}

export default function BrandPage() {
  const { data, loading, error } = useGrowthData()
  const navigate = useNavigate()
  const [appFilter, setAppFilter] = useState<string>('all')
  const [sentFilter, setSentFilter] = useState<string>('all')

  if (error === 'UNAUTHORIZED') { navigate('/login', { replace: true }); return null }
  if (loading) return <div className="p-6 animate-pulse space-y-4"><div className="h-32 bg-gray-100 rounded-xl" /><div className="h-64 bg-gray-100 rounded-xl" /></div>
  if (error) return <div className="p-6"><div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 text-sm">{error}</div></div>

  const { brand, updatedAt } = data!
  const { mentions, sentimentSummary } = brand

  const filtered = mentions.filter(m =>
    (appFilter === 'all' || m.app === appFilter) &&
    (sentFilter === 'all' || m.sentiment === sentFilter),
  )

  const pieData = [
    { name: 'Positive', value: sentimentSummary.positive },
    { name: 'Neutral',  value: sentimentSummary.neutral },
    { name: 'Negative', value: sentimentSummary.negative },
  ].filter(d => d.value > 0)

  const total = sentimentSummary.positive + sentimentSummary.neutral + sentimentSummary.negative

  return (
    <div>
      <PageHeader title="Brand Pulse" subtitle="Mentions, sentiment & community signals" updatedAt={updatedAt} />

      <div className="p-6 space-y-5">
        {total === 0 ? (
          <EmptyState
            title="No mentions yet"
            description="Run the monitoring agent to start collecting Reddit, social, and App Store signals."
          />
        ) : (
          <>
            {/* Sentiment summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                <ResponsiveContainer width={80} height={80}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={24} outerRadius={38} dataKey="value" strokeWidth={0}>
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name.toLowerCase() as keyof typeof SENTIMENT_COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`${v}`, '']} contentStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5">
                  <SentimentRow label="Positive" value={sentimentSummary.positive} total={total} color="text-green-600" />
                  <SentimentRow label="Neutral"  value={sentimentSummary.neutral}  total={total} color="text-gray-500" />
                  <SentimentRow label="Negative" value={sentimentSummary.negative} total={total} color="text-red-500" />
                </div>
              </div>
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="text-sm font-semibold text-gray-700 mb-3">Mentions by App</div>
                <div className="grid grid-cols-3 gap-3">
                  {(['kanji_mentor', 'kiku_mentor', 'yomu_mentor'] as const).map(app => {
                    const count = mentions.filter(m => m.app === app).length
                    return (
                      <div key={app} className="text-center">
                        <div className="text-2xl font-bold" style={{ color: APP_COLORS[app] }}>{count}</div>
                        <div className="text-[10px] text-gray-400">{APP_LABELS[app]}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <select value={appFilter} onChange={e => setAppFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white outline-none focus:border-blue-500">
                <option value="all">All apps</option>
                <option value="kanji_mentor">Kanji Mentor</option>
                <option value="kiku_mentor">Kiku Mentor</option>
                <option value="yomu_mentor">Yomu Mentor</option>
                <option value="suite">Suite</option>
              </select>
              <select value={sentFilter} onChange={e => setSentFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white outline-none focus:border-blue-500">
                <option value="all">All sentiment</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
              <span className="text-xs text-gray-400 self-center">{filtered.length} mentions</span>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Source</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">App</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Sentiment</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Content</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">When</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {SOURCE_LABELS[m.source] ?? m.source}
                        {m.score != null && <span className="ml-1 text-gray-400">({m.score})</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium" style={{ color: APP_COLORS[m.app] ?? '#64748b' }}>
                          {APP_LABELS[m.app] ?? m.app}
                        </span>
                      </td>
                      <td className="px-4 py-3"><SentimentBadge sentiment={m.sentiment} /></td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="text-xs text-gray-700 line-clamp-2">{m.content}</div>
                        {m.url && (
                          <a href={m.url} target="_blank" rel="noreferrer"
                            className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5 mt-0.5">
                            <ExternalLink size={10} /> View post
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtRelative(m.captured_at)}</td>
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

function SentimentRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs font-semibold w-14 ${color}`}>{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-16">
        <div className="h-full rounded-full" style={{
          width: `${pct}%`,
          backgroundColor: color.includes('green') ? '#22c55e' : color.includes('red') ? '#ef4444' : '#94a3b8',
        }} />
      </div>
      <span className="text-xs text-gray-500">{value}</span>
    </div>
  )
}

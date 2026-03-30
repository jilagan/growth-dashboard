import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/PageHeader'
import SentimentBadge from '@/components/SentimentBadge'
import EmptyState from '@/components/EmptyState'
import StatCard from '@/components/StatCard'
import { useGrowthData } from '@/hooks/useGrowthData'
import { fmtRelative, APP_LABELS, APP_COLORS } from '@/lib/utils'

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400 text-sm">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

export default function ReviewsPage() {
  const { data, loading, error } = useGrowthData()
  const navigate = useNavigate()
  const [appFilter, setAppFilter] = useState<string>('all')
  const [ratingFilter, setRatingFilter] = useState<string>('all')

  if (error === 'UNAUTHORIZED') { navigate('/login', { replace: true }); return null }
  if (loading) return <div className="p-6 animate-pulse space-y-4"><div className="h-24 bg-gray-100 rounded-xl" /><div className="h-64 bg-gray-100 rounded-xl" /></div>
  if (error) return <div className="p-6"><div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 text-sm">{error}</div></div>

  const { reviews, updatedAt } = data!
  const { items, summary } = reviews

  const filtered = items.filter(r =>
    (appFilter === 'all' || r.app_name === appFilter) &&
    (ratingFilter === 'all' || r.rating === parseInt(ratingFilter)),
  )

  const appKeys = ['kanji_mentor', 'kiku_mentor', 'yomu_mentor']

  return (
    <div>
      <PageHeader title="App Reviews" subtitle="All apps · App Store reviews" updatedAt={updatedAt} />

      <div className="p-6 space-y-5">
        {items.length === 0 ? (
          <EmptyState
            title="No reviews cached yet"
            description="The monitoring agent will pull reviews from iTunes RSS and cache them here weekly."
          />
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              {appKeys.map(app => {
                const s = summary[app]
                if (!s) return (
                  <div key={app} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="text-xs font-semibold mb-1" style={{ color: APP_COLORS[app] }}>
                      {APP_LABELS[app]}
                    </div>
                    <div className="text-gray-300 text-sm">No reviews</div>
                  </div>
                )
                return (
                  <StatCard
                    key={app}
                    label={APP_LABELS[app]}
                    value={`${s.avgRating.toFixed(1)} ★`}
                    sub={`${s.total} reviews`}
                    color={`font-bold`}
                  />
                )
              })}
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap items-center">
              <select value={appFilter} onChange={e => setAppFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white outline-none focus:border-blue-500">
                <option value="all">All apps</option>
                <option value="kanji_mentor">Kanji Mentor</option>
                <option value="kiku_mentor">Kiku Mentor</option>
                <option value="yomu_mentor">Yomu Mentor</option>
              </select>
              <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white outline-none focus:border-blue-500">
                <option value="all">All ratings</option>
                <option value="5">★★★★★ 5 stars</option>
                <option value="4">★★★★ 4 stars</option>
                <option value="3">★★★ 3 stars</option>
                <option value="2">★★ 2 stars</option>
                <option value="1">★ 1 star</option>
              </select>
              <span className="text-xs text-gray-400">{filtered.length} reviews</span>
            </div>

            {/* Reviews list */}
            <div className="space-y-2">
              {filtered.map(r => (
                <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StarRating rating={r.rating} />
                        {r.title && <span className="text-sm font-semibold text-gray-800 truncate">{r.title}</span>}
                        <SentimentBadge sentiment={r.sentiment} />
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-3">{r.content}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-medium" style={{ color: APP_COLORS[r.app_name] ?? '#64748b' }}>
                        {APP_LABELS[r.app_name] ?? r.app_name}
                      </div>
                      {r.author && <div className="text-[10px] text-gray-400 mt-0.5">{r.author}</div>}
                      {r.version && <div className="text-[10px] text-gray-300">v{r.version}</div>}
                      <div className="text-[10px] text-gray-300 mt-1">{fmtRelative(r.captured_at)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

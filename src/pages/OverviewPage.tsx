import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { RefreshCw } from 'lucide-react'
import StatCard from '@/components/StatCard'
import PageHeader from '@/components/PageHeader'
import { useGrowthData } from '@/hooks/useGrowthData'
import { APP_COLORS } from '@/lib/utils'

export default function OverviewPage() {
  const { data, loading, error, reload } = useGrowthData()
  const navigate = useNavigate()

  if (error === 'UNAUTHORIZED') {
    navigate('/login', { replace: true })
    return null
  }

  if (loading) return <LoadingSkeleton />

  if (error) return (
    <div className="p-6">
      <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 text-sm">{error}</div>
    </div>
  )

  const { overview, updatedAt } = data!
  const { kanji, kiku, yomu, totalUsers, dailyActivity } = overview

  const chartData = dailyActivity.map(d => ({
    date: new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Kanji: d.kanji,
    Kiku: d.kiku,
    Yomu: d.yomu,
  }))

  return (
    <div>
      <PageHeader title="Overview" subtitle="Cross-app analytics" updatedAt={updatedAt}>
        <button onClick={reload} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
          <RefreshCw size={12} />
          Refresh
        </button>
      </PageHeader>

      <div className="p-6 space-y-6">
        {/* Totals */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3">Suite Totals</div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Total Users" value={totalUsers} color="text-blue-600" />
            <StatCard label="Kanji Users" value={kanji.users} sub={`${kanji.activeUsers} active`} color="text-red-500" />
            <StatCard label="Kiku Users"  value={kiku.users}  sub={`${kiku.activeUsers} active`}  color="text-indigo-500" />
            <StatCard label="Yomu Users"  value={yomu.users}  sub={`${yomu.activeUsers} active`}  color="text-teal-500" />
          </div>
        </div>

        {/* App Store ratings */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3">App Store Ratings</div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <AppRatingCard name="Kanji Mentor" emoji="漢" color="bg-red-50 border-red-100" textColor="text-red-600"
              rating={kanji.rating} ratingCount={kanji.ratingCount} actions={kanji.actions} actionLabel="kanji attempts" />
            <AppRatingCard name="Kiku Mentor" emoji="聞" color="bg-indigo-50 border-indigo-100" textColor="text-indigo-600"
              rating={kiku.rating} ratingCount={kiku.ratingCount} actions={kiku.actions} actionLabel="listening sessions" />
            <AppRatingCard name="Yomu Mentor" emoji="読" color="bg-teal-50 border-teal-100" textColor="text-teal-600"
              rating={yomu.rating} ratingCount={yomu.ratingCount} actions={yomu.actions} actionLabel="passages read" />
          </div>
        </div>

        {/* Activity chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="text-sm font-semibold text-gray-700 mb-4">Daily Activity — Last 14 Days</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Kanji" fill={APP_COLORS.kanji_mentor} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Kiku"  fill={APP_COLORS.kiku_mentor}  radius={[3, 3, 0, 0]} />
              <Bar dataKey="Yomu"  fill={APP_COLORS.yomu_mentor}  radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function AppRatingCard({
  name, emoji, color, textColor, rating, ratingCount, actions, actionLabel,
}: {
  name: string; emoji: string; color: string; textColor: string
  rating: number | null; ratingCount: number | null; actions: number; actionLabel: string
}) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{emoji}</span>
        <span className="font-semibold text-sm text-gray-700">{name}</span>
      </div>
      <div className="flex items-end gap-4">
        <div>
          <div className={`text-2xl font-bold ${textColor}`}>
            {rating != null ? rating.toFixed(1) : '—'}
          </div>
          <div className="text-[10px] text-gray-400">
            {ratingCount != null ? `${ratingCount.toLocaleString()} ratings` : 'No ratings yet'}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-lg font-bold text-gray-700">{actions.toLocaleString()}</div>
          <div className="text-[10px] text-gray-400">{actionLabel}</div>
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
      </div>
      <div className="h-64 bg-gray-100 rounded-xl" />
    </div>
  )
}

export interface BrandMention {
  id: string
  captured_at: string
  source: string
  app: string
  sentiment: 'positive' | 'neutral' | 'negative'
  content: string
  url: string | null
  score: number | null
  author: string | null
}

export interface CompetitorSnapshot {
  id: string
  captured_at: string
  app_name: string
  app_id: string | null
  avg_rating: number | null
  rating_count: number | null
  version: string | null
  category_rank: number | null
  notes: string | null
}

export interface KeywordRanking {
  id: string
  captured_at: string
  keyword: string
  app_name: string
  rank: number | null
  prev_rank: number | null
  search_volume_estimate: string | null
}

export interface AppStoreReview {
  id: string
  captured_at: string
  app_name: string
  app_id: string | null
  review_id: string | null
  author: string | null
  rating: number
  title: string | null
  content: string
  version: string | null
  sentiment: 'positive' | 'neutral' | 'negative' | null
}

export interface AppStats {
  users: number
  activeUsers: number
  actions: number
  rating: number | null
  ratingCount: number | null
}

export interface GrowthData {
  updatedAt: string
  overview: {
    totalUsers: number
    kanji: AppStats
    kiku: AppStats
    yomu: AppStats
    dailyActivity: Array<{ date: string; kanji: number; kiku: number; yomu: number }>
  }
  brand: {
    mentions: BrandMention[]
    sentimentSummary: { positive: number; neutral: number; negative: number }
  }
  competitors: {
    snapshots: CompetitorSnapshot[]
    latest: Record<string, CompetitorSnapshot>
  }
  keywords: {
    latest: KeywordRanking[]
  }
  reviews: {
    items: AppStoreReview[]
    summary: Record<string, { total: number; avgRating: number }>
  }
}

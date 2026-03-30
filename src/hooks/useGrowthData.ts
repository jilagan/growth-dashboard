import { useState, useEffect, useCallback } from 'react'
import { fetchGrowthData } from '@/lib/api'
import type { GrowthData } from '@/lib/types'

export function useGrowthData() {
  const [data, setData] = useState<GrowthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const d = await fetchGrowthData()
      setData(d)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  return { data, loading, error, reload: load }
}

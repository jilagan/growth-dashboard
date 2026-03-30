import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import { setStoredPassword } from '@/lib/api'
import { FUNCTION_URL, supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
      const token = session?.access_token ?? anonKey
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-dashboard-password': pass,
          Accept: 'application/json',
        },
      })
      if (res.status === 401) {
        setError('Invalid password')
        return
      }
      setStoredPassword(pass)
      navigate('/overview', { replace: true })
    } catch {
      setError('Connection error — check network')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-80 p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-3">
            <TrendingUp size={22} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Growth HQ</h1>
          <p className="text-xs text-gray-500 mt-1">Nihongo Mentor Suite</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            placeholder="Dashboard password"
            value={pass}
            onChange={e => setPass(e.target.value)}
            autoFocus
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading || !pass}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Megaphone,
  Trophy,
  Hash,
  Star,
  LogOut,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { clearStoredPassword } from '@/lib/api'

const NAV = [
  { to: '/overview', icon: LayoutDashboard, label: 'Overview' },
  { to: '/brand', icon: Megaphone, label: 'Brand Pulse' },
  { to: '/competitors', icon: Trophy, label: 'Competitors' },
  { to: '/keywords', icon: Hash, label: 'ASO Keywords' },
  { to: '/reviews', icon: Star, label: 'App Reviews' },
]

export default function Layout() {
  const navigate = useNavigate()

  function handleLogout() {
    clearStoredPassword()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-slate-900 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight">Growth HQ</div>
              <div className="text-slate-400 text-[10px] leading-tight">Nihongo Mentor Suite</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800',
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* App pills */}
        <div className="px-4 py-3 border-t border-slate-700/50">
          <div className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold mb-2">Apps</div>
          <div className="flex gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/20 text-red-400">漢</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-400">聞</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/20 text-teal-400">読</span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="mx-3 mb-3 flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 text-xs transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

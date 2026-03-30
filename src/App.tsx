import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getStoredPassword } from '@/lib/api'
import LoginPage from '@/pages/LoginPage'
import Layout from '@/components/Layout'
import OverviewPage from '@/pages/OverviewPage'
import BrandPage from '@/pages/BrandPage'
import CompetitorsPage from '@/pages/CompetitorsPage'
import KeywordsPage from '@/pages/KeywordsPage'
import ReviewsPage from '@/pages/ReviewsPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!getStoredPassword()) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter basename="/growth-dashboard">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route path="/overview"     element={<OverviewPage />} />
          <Route path="/brand"        element={<BrandPage />} />
          <Route path="/competitors"  element={<CompetitorsPage />} />
          <Route path="/keywords"     element={<KeywordsPage />} />
          <Route path="/reviews"      element={<ReviewsPage />} />
          <Route path="*"             element={<Navigate to="/overview" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

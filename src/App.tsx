import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { onUnauthorized } from './api/client'
import { AppShell } from './components/layout/AppShell'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { ConciliationPage } from './pages/ConciliationPage'
import { DistributionPage } from './pages/DistributionPage'
import { LoginPage } from './pages/LoginPage'
import { RadarPage } from './pages/RadarPage'
import { ReportsPage } from './pages/ReportsPage'
import { useAuthStore } from './store/authStore'

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate)
  const logout = useAuthStore((s) => s.logout)

  useEffect(() => {
    hydrate()
    onUnauthorized(() => {
      logout('Sessão expirada. Faça login novamente.')
    })
  }, [hydrate, logout])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/reports" replace />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="distribuicao" element={<DistributionPage />} />
          <Route path="radar" element={<RadarPage />} />
          <Route path="conciliacao" element={<ConciliationPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

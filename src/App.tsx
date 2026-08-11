import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import MapaPage from './pages/MapaPage'
import TablaPage from './pages/TablaPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import { useLotesStore } from './store/useLotesStore'
import { useAuthStore } from './store/useAuthStore'

export default function App() {
  const fetchLotes = useLotesStore((s) => s.fetchLotes)
  const subscribeRealtime = useLotesStore((s) => s.subscribeRealtime)
  const initAuth = useAuthStore((s) => s.init)
  const location = useLocation()

  useEffect(() => {
    fetchLotes()
    const unsubscribe = subscribeRealtime()
    const unsubscribeAuth = initAuth()
    return () => {
      unsubscribe()
      unsubscribeAuth()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // La barra de navegación no tiene sentido en la pantalla de login
  // (todavía no hay sesión ni nada que navegar).
  const mostrarNavbar = location.pathname !== '/login'

  return (
    <div className="h-screen flex flex-col">
      {mostrarNavbar && <Navbar />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Todo el sitio requiere sesión iniciada — el login aparece de entrada. */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MapaPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tabla"
          element={
            <ProtectedRoute>
              <TablaPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

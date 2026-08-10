import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
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

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <Routes>
        <Route path="/" element={<MapaPage />} />
        <Route path="/tabla" element={<TablaPage />} />
        <Route path="/login" element={<LoginPage />} />
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
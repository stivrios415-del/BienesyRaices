import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import MobileTabBar from './components/MobileTabBar'
import ProtectedRoute from './components/ProtectedRoute'
import MapaPage from './pages/MapaPage'
import TablaPage from './pages/TablaPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import { useLotesStore } from './store/useLotesStore'
import { useAuthStore } from './store/useAuthStore'
import { useFacturacionStore } from './store/useFacturacionStore'

export default function App() {
  const fetchLotes = useLotesStore((s) => s.fetchLotes)
  const resetLotes = useLotesStore((s) => s.resetLotes)
  const subscribeRealtime = useLotesStore((s) => s.subscribeRealtime)
  const resetFacturacion = useFacturacionStore((s) => s.resetFacturacion)
  const initAuth = useAuthStore((s) => s.init)
  const session = useAuthStore((s) => s.session)
  const location = useLocation()

  // La sesión se inicializa UNA sola vez, al montar la app.
  useEffect(() => {
    const unsubscribeAuth = initAuth()
    return () => unsubscribeAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // TODO lo que depende de "quién soy" se vuelve a cargar cada vez que
  // cambia el usuario logueado (login, logout, o cambio de cuenta en la
  // misma pestaña). Antes esto solo corría una vez al arrancar la app,
  // así que si alguien cerraba sesión y entraba con otro correo SIN
  // recargar la página, la pantalla se quedaba mostrando los datos del
  // usuario anterior — no era una falla de seguridad en la base de datos,
  // pero sí un bug real que había que cerrar.
  const userId = session?.user?.id ?? null

  useEffect(() => {
    if (!userId) {
      resetLotes()
      resetFacturacion()
      return
    }

    fetchLotes()
    const unsubscribeRealtime = subscribeRealtime()
    return () => unsubscribeRealtime()
  }, [userId, fetchLotes, resetLotes, resetFacturacion, subscribeRealtime])

  const enSesion = location.pathname !== '/login'

  return (
    <div className="h-screen flex flex-col">
      {enSesion && <Navbar />}
      <div className={`flex-1 flex flex-col overflow-hidden ${enSesion ? 'pb-16 md:pb-0' : ''}`}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

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
      {enSesion && <MobileTabBar />}
    </div>
  )
}

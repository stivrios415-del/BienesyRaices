import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

export default function Login() {
  const signIn = useAuthStore((s) => s.signIn)
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setError(null)
    const { error } = await signIn(email, password)
    setCargando(false)
    if (error) {
      setError(error)
      return
    }
    navigate('/admin')
  }

  return (
    <div className="min-h-full flex items-center justify-center p-4 bg-blueprint bg-grid">
      <form onSubmit={handleSubmit} className="w-full max-w-sm card p-7 survey-corners">
        <div className="text-center mb-6">
          <svg width="30" height="30" viewBox="0 0 26 26" fill="none" className="mx-auto mb-3">
            <rect x="1" y="1" width="24" height="24" rx="2" stroke="#A8823D" strokeWidth="1.2" />
            <path d="M13 4 L22 10 V22 H4 V10 Z" stroke="#A8823D" strokeWidth="1.1" fill="none" />
            <circle cx="13" cy="13" r="2" fill="#A8823D" />
          </svg>
          <div className="eyebrow mb-1">Acceso administrativo</div>
          <h1 className="font-display text-2xl text-ink-900">Iniciar sesión</h1>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label-field">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field"
            />
          </div>
          {error && <p className="text-estado-vendido text-sm">{error}</p>}
          <button type="submit" disabled={cargando} className="btn-primary w-full">
            {cargando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </div>
      </form>
    </div>
  )
}
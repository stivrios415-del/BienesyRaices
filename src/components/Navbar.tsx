import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

export default function Navbar() {
  const { signOut } = useAuthStore()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative px-3.5 py-2 text-[13px] font-medium tracking-wide transition-colors ${
      isActive ? 'text-paper' : 'text-ink-300 hover:text-paper'
    }`

  return (
    <nav className="h-14 md:h-16 bg-ink-950 border-b border-brass-700/30 flex items-center justify-between px-4 md:px-8 shrink-0 relative z-20">
      <div className="flex items-center gap-2.5">
        <svg width="24" height="24" viewBox="0 0 26 26" fill="none" className="shrink-0">
          <rect x="1" y="1" width="24" height="24" rx="2" stroke="#C7A052" strokeWidth="1.2" />
          <path d="M13 4 L22 10 V22 H4 V10 Z" stroke="#C7A052" strokeWidth="1.1" fill="none" />
          <circle cx="13" cy="13" r="2" fill="#C7A052" />
        </svg>
        <div className="leading-tight">
          <div className="font-display text-[15px] md:text-[17px] text-paper tracking-wide">Catastro</div>
          <div className="hidden sm:block text-[10px] text-brass-400 uppercase tracking-widest2 -mt-0.5">
            Gestión de lotes
          </div>
        </div>
      </div>

      {/* Navegación por texto — solo en pantallas medianas en adelante.
          En móvil la navegación vive en la barra inferior (MobileTabBar). */}
      <div className="hidden md:flex items-center gap-1">
        <NavLink to="/" end className={linkClass}>
          {({ isActive }) => (
            <span className="flex flex-col items-center gap-1.5">
              Mapa
              <span className={`h-[1.5px] w-full ${isActive ? 'bg-brass-400' : 'bg-transparent'}`} />
            </span>
          )}
        </NavLink>
        <NavLink to="/tabla" className={linkClass}>
          {({ isActive }) => (
            <span className="flex flex-col items-center gap-1.5">
              Registro
              <span className={`h-[1.5px] w-full ${isActive ? 'bg-brass-400' : 'bg-transparent'}`} />
            </span>
          )}
        </NavLink>
        <NavLink to="/admin" className={linkClass}>
          {({ isActive }) => (
            <span className="flex flex-col items-center gap-1.5">
              Administración
              <span className={`h-[1.5px] w-full ${isActive ? 'bg-brass-400' : 'bg-transparent'}`} />
            </span>
          )}
        </NavLink>
        <div className="w-px h-5 bg-ink-700 mx-2" />
        <button
          onClick={() => signOut()}
          className="px-3.5 py-2 text-[13px] font-medium text-ink-300 hover:text-paper transition-colors"
        >
          Cerrar sesión
        </button>
      </div>

      {/* En móvil solo queda el botón de salir; el resto de la navegación
          va en la barra inferior. */}
      <button
        onClick={() => signOut()}
        className="md:hidden px-2.5 py-1.5 text-[12px] font-medium text-ink-300 hover:text-paper transition-colors"
      >
        Salir
      </button>
    </nav>
  )
}

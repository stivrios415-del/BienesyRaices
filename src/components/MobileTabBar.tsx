import { NavLink } from 'react-router-dom'

const tabs = [
  {
    to: '/',
    label: 'Mapa',
    icon: (activo: boolean) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20V6.5Z"
          stroke={activo ? '#C7A052' : '#5A6B85'}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M9 4v13.5M15 6.5V20" stroke={activo ? '#C7A052' : '#5A6B85'} strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    to: '/tabla',
    label: 'Registro',
    icon: (activo: boolean) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
        <rect x="3.5" y="4" width="17" height="16" rx="1.5" stroke={activo ? '#C7A052' : '#5A6B85'} strokeWidth="1.6" />
        <path d="M3.5 9.5h17M8.5 9.5V20" stroke={activo ? '#C7A052' : '#5A6B85'} strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    to: '/admin',
    label: 'Administrar',
    icon: (activo: boolean) => (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3 20 7v6c0 4.5-3.4 7.4-8 8-4.6-.6-8-3.5-8-8V7l8-4Z"
          stroke={activo ? '#C7A052' : '#5A6B85'}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="m9 12 2 2 4-4" stroke={activo ? '#C7A052' : '#5A6B85'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

export default function MobileTabBar() {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-ink-950 border-t border-brass-700/30 flex items-stretch"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {tabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.to === '/'} className="flex-1">
          {({ isActive }) => (
            <div className="flex flex-col items-center justify-center gap-1 py-2.5">
              {tab.icon(isActive)}
              <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'text-brass-400' : 'text-ink-300'}`}>
                {tab.label}
              </span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
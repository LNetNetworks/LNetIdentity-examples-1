import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { CardsIcon, ChevronLeftIcon, FilePlusIcon, ScanIcon, UserIcon } from './Icons'

interface AppShellProps {
  title: string
  children: ReactNode
  /** Muestra la navegación inferior (pantallas de primer nivel). */
  showNav?: boolean
  /** Ruta a la que vuelve la flecha; `true` usa el historial. */
  back?: string | true
  /** Acción opcional a la derecha del encabezado. */
  action?: ReactNode
  /** Quita el padding del contenedor principal. */
  flush?: boolean
}

export function AppShell({
  title,
  children,
  showNav = false,
  back,
  action,
  flush = false,
}: AppShellProps) {
  const navigate = useNavigate()

  const mainClass = [
    'app-main',
    showNav ? 'app-main--with-nav' : '',
    flush ? 'app-main--flush' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__row">
          {back ? (
            <button
              type="button"
              className="icon-button"
              aria-label="Volver"
              onClick={() => (back === true ? navigate(-1) : navigate(back))}
            >
              <ChevronLeftIcon />
            </button>
          ) : (
            <span style={{ width: 40, flex: '0 0 40px' }} aria-hidden="true" />
          )}

          <h1 className={back ? 'app-header__title app-header__title--centered' : 'app-header__title'}>
            {title}
          </h1>

          {action ?? <span style={{ width: 40, flex: '0 0 40px' }} aria-hidden="true" />}
        </div>
      </header>

      <main className={mainClass}>{children}</main>

      {showNav && <BottomNav />}
    </div>
  )
}

const NAV_ITEMS = [
  { to: '/', label: 'Credenciales', Icon: CardsIcon, end: true },
  { to: '/scan', label: 'Escanear', Icon: ScanIcon, end: false },
  { to: '/request', label: 'Solicitar', Icon: FilePlusIcon, end: false },
  { to: '/profile', label: 'Perfil', Icon: UserIcon, end: false },
]

function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      <div className="bottom-nav__inner">
        {NAV_ITEMS.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="bottom-nav__item">
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

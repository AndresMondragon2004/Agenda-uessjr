import { useState, useEffect, useCallback } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { Moon, Sun, Menu, X, GraduationCap } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV_LINKS = [
  { label: 'Inicio',             to: '/'               },
  { label: 'Agenda',             to: '/agenda'         },
  { label: 'Conferencistas',     to: '/conferencistas' },
  { label: 'Proponer actividad', to: '/proponer'       },
]

function Logo() {
  return (
    <div className="flex items-center gap-4">
      <NavLink
        to="/"
        className="flex items-center gap-2.5 shrink-0 focus:outline-none group"
        aria-label="UESSJR Agenda – inicio"
      >
        <div className="w-9 h-9 rounded-xl bg-[#1B4332] flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
          <GraduationCap className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-extrabold text-base text-[#1B4332] dark:text-emerald-400 tracking-tight">
            UESSJR
          </span>
          <span className="font-medium text-[10px] text-gray-400 dark:text-emerald-700 tracking-widest uppercase -mt-0.5">
            Agenda
          </span>
        </div>
      </NavLink>
      
      <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-gray-100 dark:border-emerald-900/30">
        <img src="https://sic.cultura.gob.mx/imagenes_cache/universidad_4260_g_74199.png" alt="Logo UMB" className="h-7 object-contain opacity-90 hover:opacity-100 transition-opacity" />
        <img src="/images/logos/ues-sjr.png" alt="Logo UES SJR" className="h-7 object-contain opacity-80 hover:opacity-100 transition-opacity dark:brightness-0 dark:invert" />
      </div>
    </div>
  )
}

function desktopLinkClass({ isActive }) {
  return [
    'relative pb-1 text-sm font-medium transition-colors duration-150 whitespace-nowrap',
    isActive
      ? 'font-bold text-[#1B4332] dark:text-emerald-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#1B4332] dark:after:bg-emerald-400 after:rounded-full'
      : 'text-gray-500 dark:text-gray-400 hover:text-[#1B4332] dark:hover:text-emerald-400',
  ].join(' ')
}

function drawerLinkClass({ isActive }) {
  return [
    'flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150',
    isActive
      ? 'bg-[#1B4332] dark:bg-emerald-800 text-white font-bold'
      : 'text-gray-600 dark:text-gray-300 hover:bg-[#1B4332]/8 dark:hover:bg-emerald-900/30 hover:text-[#1B4332] dark:hover:text-emerald-400',
  ].join(' ')
}

export default function Navbar() {
  const location                            = useLocation()
  const { isLoggedIn, estudiante, isAdmin, signOut } = useAuth()
  const [drawerOpen, setDrawerOpen]         = useState(false)
  const [darkMode,   setDarkMode]           = useState(() => {
    try {
      const saved = localStorage.getItem('uessjr-dark')
      if (saved !== null) return saved === 'true'
    } catch (e) {}
    return document.documentElement.classList.contains('dark')
  })
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => { setDrawerOpen(false) }, [location])

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toggleDark = useCallback(() => {
    const html = document.documentElement
    html.classList.add('no-transition')
    const next = !html.classList.contains('dark')
    html.classList.toggle('dark', next)
    setDarkMode(next)
    try { localStorage.setItem('uessjr-dark', String(next)) } catch (e) {}
    requestAnimationFrame(() => html.classList.remove('no-transition'))
  }, [])

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  return (
    <>
      {/* ━━━━━━━━━━━  NAVBAR  ━━━━━━━━━━━ */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/98 dark:bg-[#0A1A11]/98 backdrop-blur-md shadow-md border-b border-gray-100 dark:border-emerald-900/40'
            : 'bg-white/95 dark:bg-[#0A1A11]/95 backdrop-blur-sm shadow-sm border-b border-gray-100/80 dark:border-emerald-900/30'
        }`}
        style={{ height: 64 }}
      >
        <div className="mx-auto h-full flex items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl">

          <Logo />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Navegación principal">
            {NAV_LINKS.map(({ label, to }) => (
              <NavLink key={to} to={to} end={to === '/'} className={desktopLinkClass}>
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">

            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              aria-label={darkMode ? 'Modo claro' : 'Modo oscuro'}
              className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-[#1B4332] dark:hover:text-emerald-400 hover:bg-[#1B4332]/8 dark:hover:bg-emerald-900/30 transition-colors"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Auth desktop */}
            {isLoggedIn ? (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to={isAdmin ? "/admin/dashboard" : "/mi-agenda"}
                  className="text-sm font-semibold text-[#1B4332] dark:text-emerald-400 hover:underline px-3 py-1.5"
                >
                  {isAdmin ? "Panel Admin" : "Mi agenda"}
                </Link>
                <div className="relative group">
                  <button className="w-9 h-9 rounded-full bg-[#1B4332] flex items-center justify-center text-white font-bold text-sm shadow-sm hover:shadow-md hover:scale-105 transition-all">
                    {isAdmin ? 'A' : (estudiante?.nombre?.charAt(0)?.toUpperCase() || 'U')}
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#122A1C] rounded-xl shadow-xl border border-gray-100 dark:border-emerald-900/50 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="px-4 py-2.5 border-b border-gray-100 dark:border-emerald-900/40">
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {isAdmin ? 'Administrador' : `${estudiante?.nombre} ${estudiante?.apellidos}`}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                        {isAdmin ? 'Admin' : estudiante?.correo}
                      </p>
                    </div>
                    <Link
                      to={isAdmin ? "/admin/dashboard" : "/mi-agenda"}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-emerald-900/30 hover:text-[#1B4332] dark:hover:text-emerald-400 transition-colors"
                    >
                      {isAdmin ? "Ir al panel" : "Mi agenda"}
                    </Link>
                    <button
                      onClick={async () => { try { await signOut() } catch (e) {} }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors border-t border-gray-100 dark:border-emerald-900/40 mt-1"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-[#1B4332] dark:text-emerald-400 border border-[#1B4332]/30 dark:border-emerald-700/50 hover:bg-[#1B4332]/5 dark:hover:bg-emerald-900/30 transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/registro"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#1B4332] dark:bg-emerald-700 hover:bg-emerald-800 dark:hover:bg-emerald-600 transition-colors shadow-sm"
                >
                  Registrarse
                </Link>
              </div>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir menú"
              className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-[#1B4332] dark:hover:text-emerald-400 hover:bg-[#1B4332]/8 dark:hover:bg-emerald-900/30 transition-colors"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* ━━━━━━━━━━━  OVERLAY MÓVIL  ━━━━━━━━━━━ */}
      <div
        onClick={closeDrawer}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* ━━━━━━━━━━━  DRAWER MÓVIL  ━━━━━━━━━━━ */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className="fixed top-0 right-0 z-50 h-full bg-white dark:bg-[#0F1F18] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out md:hidden"
        style={{ width: 300, transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* Header del drawer */}
        <div className="flex items-center justify-between px-5 border-b border-gray-100 dark:border-emerald-900/40" style={{ height: 64 }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#1B4332] flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-amber-400" />
            </div>
            <span className="font-extrabold text-sm text-[#1B4332] dark:text-emerald-400">UESSJR Agenda</span>
          </div>
          <button
            onClick={closeDrawer}
            aria-label="Cerrar menú"
            className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-emerald-900/30 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
          {NAV_LINKS.map(({ label, to }) => (
            <NavLink
              key={to} to={to} end={to === '/'}
              className={drawerLinkClass}
              onClick={closeDrawer}
            >
              {label}
            </NavLink>
          ))}
          <div className="pt-3 mt-3 border-t border-gray-100 dark:border-emerald-900/40">
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest px-4 mb-2 font-medium">
              Configuración
            </p>
            <button
              onClick={toggleDark}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-emerald-900/30 transition-colors"
            >
              {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
              {darkMode ? 'Modo claro' : 'Modo oscuro'}
            </button>
          </div>
        </nav>

        {/* Footer auth */}
        <div className="px-4 pb-8 pt-4 border-t border-gray-100 dark:border-emerald-900/40 space-y-3">
          {isLoggedIn ? (
            <>
              <div className="flex items-center gap-3 px-2 py-2 mb-1">
                <div className="w-9 h-9 rounded-full bg-[#1B4332] flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {isAdmin ? 'A' : (estudiante?.nombre?.charAt(0)?.toUpperCase() || 'U')}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {isAdmin ? 'Administrador' : estudiante?.nombre}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {isAdmin ? 'Admin' : estudiante?.correo}
                  </p>
                </div>
              </div>
              <NavLink
                to={isAdmin ? "/admin/dashboard" : "/mi-agenda"} onClick={closeDrawer}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-[#1B4332] hover:bg-emerald-800 transition-colors"
              >
                {isAdmin ? "Panel Admin" : "Mi agenda"}
              </NavLink>
              <button
                onClick={async () => { try { await signOut() } catch (e) {} closeDrawer() }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-red-500 dark:text-red-400 border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login" onClick={closeDrawer}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-[#1B4332] hover:bg-emerald-800 transition-colors"
              >
                Iniciar sesión
              </NavLink>
              <NavLink
                to="/registro" onClick={closeDrawer}
                className="flex items-center justify-center w-full py-2.5 rounded-xl text-sm font-semibold border-2 border-[#1B4332] dark:border-emerald-700 text-[#1B4332] dark:text-emerald-400 hover:bg-[#1B4332]/5 dark:hover:bg-emerald-900/30 transition-colors"
              >
                Registrarse
              </NavLink>
            </>
          )}
        </div>
      </aside>
    </>
  )
}

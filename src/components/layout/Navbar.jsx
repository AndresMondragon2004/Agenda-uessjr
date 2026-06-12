import { useState, useEffect, useCallback } from 'react'
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { Moon, Sun, Menu, X, GraduationCap } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import NotificationBell from './NotificationBell'
import BrandedLogo from '../ui/BrandedLogo'

const NAV_LINKS = [
  { label: 'Inicio',             to: '/'               },
  { label: 'Agenda',             to: '/agenda'         },
  { label: 'Conferencistas',     to: '/conferencistas' },
  { label: 'Proponer actividad', to: '/proponer'       },
]

function desktopLinkClass({ isActive }) {
  return [
    'relative pb-1 text-sm font-medium transition-colors duration-150 whitespace-nowrap',
    isActive
      ? 'font-bold text-primary dark:text-emerald-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary dark:after:bg-emerald-400 after:rounded-full'
      : 'text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-emerald-400',
  ].join(' ')
}

function drawerLinkClass({ isActive }) {
  return [
    'flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150',
    isActive
      ? 'bg-primary dark:bg-emerald-800 text-white font-bold'
      : 'text-gray-600 dark:text-gray-300 hover:bg-primary/10 dark:hover:bg-emerald-900/30 hover:text-primary dark:hover:text-emerald-400',
  ].join(' ')
}

export default function Navbar({ isPreview = false, forceDarkMode = null }) {
  const location                            = useLocation()
  const navigate                            = useNavigate()
  const { isLoggedIn, estudiante, isAdmin, signOut } = useAuth()
  const { settings } = useSettings()
  const mostrarPonentes = settings?.feature_flags?.mostrar_ponentes !== false
  const navLinks = NAV_LINKS.filter(link => {
    if (link.to === '/conferencistas' && !mostrarPonentes) return false
    return true
  })
  const [drawerOpen, setDrawerOpen]         = useState(false)
  const [darkMode,   setDarkMode]           = useState(() => {
    if (forceDarkMode !== null) return forceDarkMode
    try {
      const saved = localStorage.getItem('uessjr-dark')
      if (saved !== null) return saved === 'true'
    } catch (e) {}
    return typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  })
  const [scrolled, setScrolled] = useState(false)

  // Sincronizar darkMode con forceDarkMode si cambia
  useEffect(() => {
    if (forceDarkMode !== null) {
      setDarkMode(forceDarkMode)
    }
  }, [forceDarkMode])

  useEffect(() => { setDrawerOpen(false) }, [location])

  useEffect(() => {
    if (isPreview) return; // No bloquear scroll en preview
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen, isPreview])

  useEffect(() => {
    if (isPreview) return;
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isPreview])

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
        className={`${isPreview ? 'absolute' : 'fixed'} top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-bg-main/98 dark:bg-bg-dark/98 backdrop-blur-md shadow-md border-b border-gray-100 dark:border-emerald-900/40'
            : 'bg-bg-main dark:bg-bg-dark shadow-sm border-b border-gray-100/80 dark:border-emerald-900/30'
        }`}
        style={{ height: 72 }}
      >

        <div className="mx-auto h-full flex items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl gap-4">

          <div className="flex-shrink-0">
            <NavLink to="/" aria-label="Inicio">
              <BrandedLogo isDarkTheme={darkMode} />
            </NavLink>
          </div>

          {/* Desktop nav - Centered */}
          <nav className="hidden md:flex items-center gap-10 h-full flex-1 justify-center" aria-label="Navegación principal">
            {navLinks.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `relative h-full flex items-center text-[15px] font-medium transition-colors duration-150 whitespace-nowrap pt-1 ${
                    isActive
                      ? 'font-bold text-gray-900 dark:text-emerald-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-emerald-400'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{label}</span>
                    {isActive && (
                      <motion.div
                        layoutId={isPreview ? undefined : "activeUnderline"}
                        className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary dark:bg-emerald-400 rounded-t-full"
                        transition={isPreview ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3 flex-shrink-0">

            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              aria-label={darkMode ? 'Modo claro' : 'Modo oscuro'}
              className="p-2.5 rounded-full text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-emerald-900/20 transition-all active:scale-95 mr-1"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Auth desktop */}
            {isLoggedIn ? (
              <div className="hidden md:flex items-center gap-3">
                {/* Notifications (Pro) */}
                {!isAdmin && <NotificationBell />}
                
                <Link
                  to={isAdmin ? "/admin/dashboard" : "/mi-agenda"}
                  className="px-6 py-2.5 rounded-full text-sm font-bold text-primary dark:text-emerald-400 border-2 border-primary/20 dark:border-emerald-700/50 hover:bg-primary/5 dark:hover:bg-emerald-900/30 transition-all active:scale-95"
                >
                  {isAdmin ? "Panel Admin" : "Mi agenda"}
                </Link>
                <div className="relative group">
                  <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-[#05140B] dark:text-white font-bold text-sm shadow-md hover:shadow-lg hover:scale-105 transition-all">
                    {isAdmin ? 'A' : (estudiante?.nombre?.charAt(0)?.toUpperCase() || 'U')}
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#122A1C] rounded-2xl shadow-2xl border border-gray-100 dark:border-emerald-900/50 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="px-4 py-2.5 border-b border-gray-100 dark:border-emerald-900/40">
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {isAdmin ? 'Administrador' : `${estudiante?.nombre} ${estudiante?.apellidos}`}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5 uppercase tracking-widest font-bold">
                        {isAdmin ? 'Admin' : estudiante?.correo}
                      </p>
                    </div>
                    <Link
                      to={isAdmin ? "/admin/dashboard" : "/mi-agenda"}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-emerald-900/30 hover:text-primary dark:hover:text-emerald-400 transition-colors"
                    >
                      {isAdmin ? "Ir al panel" : "Mi agenda"}
                    </Link>
                    {!isAdmin && (
                      <>
                        <Link
                          to="/mi-agenda?tab=perfil"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-emerald-900/30 hover:text-primary dark:hover:text-emerald-400 transition-colors"
                        >
                          Mi perfil
                        </Link>
                        <Link
                          to={`/ticket/${estudiante?.id}`}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-emerald-900/30 hover:text-primary dark:hover:text-emerald-400 transition-colors"
                        >
                          Mi ticket (QR)
                        </Link>
                      </>
                    )}
                    <button
                      onClick={async () => { try { await signOut(); navigate('/'); } catch (e) {} }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors border-t border-gray-100 dark:border-emerald-900/40 mt-1"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-6 py-2.5 rounded-full text-sm font-bold text-gray-700 dark:text-emerald-400 border-2 border-gray-200 dark:border-emerald-700/50 hover:bg-gray-50 dark:hover:bg-emerald-900/30 transition-all active:scale-95"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/registro"
                  className="px-6 py-2.5 rounded-full text-sm font-bold text-white bg-primary dark:bg-emerald-700 hover:opacity-90 dark:hover:bg-emerald-600 transition-all shadow-md shadow-primary/20 active:scale-95"
                >
                  Registrarse
                </Link>
              </div>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir menú"
              className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-emerald-400 hover:bg-primary/10 dark:hover:bg-emerald-900/30 transition-colors"
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
        className="fixed top-0 right-0 z-50 h-full bg-bg-main dark:bg-bg-dark shadow-2xl flex flex-col transition-transform duration-300 ease-in-out md:hidden"
        style={{ width: 300, transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* Header del drawer */}
        <div className="flex items-center justify-between px-5 border-b border-gray-100 dark:border-emerald-900/40" style={{ height: 64 }}>
          <BrandedLogo isDarkTheme={darkMode} showText={true} />
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
          {navLinks.map(({ label, to }) => (
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
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
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
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:opacity-90 transition-colors"
              >
                {isAdmin ? "Panel Admin" : "Mi agenda"}
              </NavLink>
              {!isAdmin && (
                <>
                  <NavLink
                    to="/mi-agenda?tab=perfil" onClick={closeDrawer}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-primary dark:text-emerald-400 border border-primary/30 dark:border-emerald-700/50 hover:bg-primary/10 dark:hover:bg-emerald-900/30 transition-colors"
                  >
                    Mi perfil
                  </NavLink>
                  <NavLink
                    to={`/ticket/${estudiante?.id}`} onClick={closeDrawer}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-primary dark:text-emerald-400 border border-primary/30 dark:border-emerald-700/50 hover:bg-primary/10 dark:hover:bg-emerald-900/30 transition-colors"
                  >
                    Mi ticket (QR)
                  </NavLink>
                </>
              )}
              <button
                onClick={async () => { try { await signOut(); navigate('/'); } catch (e) {} closeDrawer() }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-red-500 dark:text-red-400 border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login" onClick={closeDrawer}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:opacity-90 transition-colors"
              >
                Iniciar sesión
              </NavLink>
              <NavLink
                to="/registro" onClick={closeDrawer}
                className="flex items-center justify-center w-full py-2.5 rounded-xl text-sm font-semibold border-2 border-primary dark:border-emerald-700 text-primary dark:text-emerald-400 hover:bg-primary/10 dark:hover:bg-emerald-900/30 transition-colors"
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

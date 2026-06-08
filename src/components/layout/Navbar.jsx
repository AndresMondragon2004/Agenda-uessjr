import { useState, useEffect, useCallback } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Sun, Menu, X, GraduationCap, ChevronRight, LogOut, LayoutDashboard, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import NotificationBell from './NotificationBell'

const NAV_LINKS = [
  { label: 'Inicio',             to: '/'               },
  { label: 'Agenda',             to: '/agenda'         },
  { label: 'Conferencistas',     to: '/conferencistas' },
  { label: 'Proponer actividad', to: '/proponer'       },
]

function Logo() {
  return (
    <div className="flex items-center gap-6">
      <NavLink
        to="/"
        className="flex items-center gap-3 shrink-0 focus:outline-none group"
        aria-label="UESSJR Agenda – inicio"
      >
        <div className="w-12 h-12 rounded-2xl bg-ues-green flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-300">
          <GraduationCap className="w-7 h-7 text-apple" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-serif font-black text-2xl text-gray-900 dark:text-white tracking-tighter">
            UESSJR
          </span>
          <span className="font-black text-[10px] text-ues-green dark:text-ues-gold tracking-[0.4em] uppercase mt-1 opacity-80">
            Agenda
          </span>
        </div>
      </NavLink>
      
      {/* Logos Institucionales - Separados por línea fina */}
      <div className="hidden xl:flex items-center gap-6 pl-8 border-l border-gray-100 dark:border-white/5">
        <img 
          src="https://sic.cultura.gob.mx/imagenes_cache/universidad_4260_g_74199.png" 
          alt="UMB" 
          className="h-8 object-contain opacity-90 hover:opacity-100 transition-opacity dark:brightness-0 dark:invert" 
        />
        <img 
          src="/images/logos/ues-sjr.png" 
          alt="UES SJR" 
          className="h-8 object-contain opacity-80 hover:opacity-100 transition-opacity dark:brightness-0 dark:invert" 
        />
      </div>
    </div>
  )
}

export default function Navbar() {
  const { isLoggedIn, estudiante, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toggleDark = useCallback(() => {
    const next = !darkMode
    document.documentElement.classList.toggle('dark', next)
    setDarkMode(next)
    localStorage.setItem('uessjr-dark', next)
  }, [darkMode])

  const handleLogout = async () => {
    await signOut()
    setDrawerOpen(false)
    navigate('/')
  }

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 border-b w-full ${
        scrolled
          ? 'bg-white/95 dark:bg-surface-dark-bg/95 backdrop-blur-md shadow-lg border-gray-100 dark:border-white/5 py-4'
          : 'bg-white dark:bg-surface-dark-bg border-transparent py-6'
      }`}
    >
      <div className="w-full flex items-center justify-between px-6 lg:px-12">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden xl:flex items-center gap-12" aria-label="Navegación principal">
          {NAV_LINKS.map(({ label, to }) => (
            <NavLink 
              key={to} to={to} end={to === '/'}
              className={({ isActive }) => `text-[11px] font-black uppercase tracking-[0.3em] transition-all hover:text-ues-green dark:hover:text-apple relative ${
                isActive ? 'text-ues-green dark:text-apple' : 'text-gray-400'
              }`}
            >
              {({ isActive }) => (
                <>
                  {label}
                  {isActive && <motion.div layoutId="nav-active" className="absolute -bottom-2 left-0 right-0 h-0.5 bg-ues-gold rounded-full" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-4 lg:gap-8">
          <button
            onClick={toggleDark}
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-all border border-transparent hover:border-gray-100 dark:hover:border-white/10"
          >
            {darkMode ? <Sun size={20} className="text-apple" /> : <Moon size={20} />}
          </button>

          {isLoggedIn && <NotificationBell />}

          <div className="h-8 w-px bg-gray-100 dark:bg-white/10 hidden sm:block" />

          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <Link
                to={isAdmin ? "/admin/dashboard" : "/mi-agenda"}
                className="flex items-center gap-3 group"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tight truncate max-w-[120px]">
                    {isAdmin ? 'Admin' : (estudiante?.nombre || 'Mi Perfil')}
                  </p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    {isAdmin ? 'Administrador' : 'Estudiante'}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-ues-green transition-all overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm">
                  {isAdmin ? <LayoutDashboard size={20} /> : (
                    estudiante?.foto_url ? (
                      <img src={estudiante.foto_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : <User size={20} />
                  )}
                </div>
              </Link>
              <button 
                onClick={handleLogout}
                className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link 
              to="/login"
              className="hidden lg:flex items-center gap-3 bg-ues-green text-white px-10 py-4 rounded-full text-[11px] font-black uppercase tracking-[0.2em] hover:bg-emerald-900 transition-all shadow-xl shadow-ues-green/20"
            >
              Acceder <ChevronRight size={16} />
            </Link>
          )}

          {/* Mobile Toggle */}
          <button 
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="xl:hidden w-11 h-11 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-900 dark:text-white border border-gray-100 dark:border-white/10"
          >
            {drawerOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] xl:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-[85%] max-w-md bg-white dark:bg-surface-dark-bg z-[70] xl:hidden shadow-2xl p-10 flex flex-col"
            >
              <div className="flex items-center justify-between mb-16">
                <Logo />
                <button onClick={() => setDrawerOpen(false)} className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-900 dark:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 space-y-6">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) => `flex items-center justify-between p-6 rounded-3xl transition-all text-[12px] font-black uppercase tracking-[0.3em] ${
                      isActive ? 'bg-ues-green text-white shadow-xl shadow-ues-green/20' : 'bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white'
                    }`}
                  >
                    {link.label} <ChevronRight size={18} />
                  </NavLink>
                ))}
              </div>

              <div className="pt-10 border-t border-gray-100 dark:border-white/5 space-y-4">
                {isLoggedIn ? (
                  <>
                    <Link 
                      to={isAdmin ? "/admin/dashboard" : "/mi-agenda"}
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-4 p-6 rounded-3xl bg-ues-green text-white text-[12px] font-black uppercase tracking-[0.3em] shadow-lg"
                    >
                      <LayoutDashboard size={20} /> Mi Panel
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-4 p-6 rounded-3xl bg-red-50 dark:bg-red-950/20 text-red-600 text-[12px] font-black uppercase tracking-[0.3em]"
                    >
                      <LogOut size={20} /> Finalizar Sesión
                    </button>
                  </>
                ) : (
                  <Link 
                    to="/login"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center justify-center gap-4 bg-ues-green text-white p-6 rounded-3xl text-[12px] font-black uppercase tracking-[0.3em] shadow-xl"
                  >
                    Iniciar Sesión <ChevronRight size={20} />
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}

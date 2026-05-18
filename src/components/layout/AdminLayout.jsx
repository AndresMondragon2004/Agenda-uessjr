import { useState, useEffect, useCallback } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, MapPin, ListVideo, FileText, Users, BarChart3, LogOut, Sun, Moon, Search, Shield } from 'lucide-react'
import { jornadaService } from '../../services/jornada.service'
import { useAuth } from '../../context/AuthContext'
import CommandPalette from '../admin/CommandPalette'
import ScrollToTop from '../ui/ScrollToTop'

// ─── Logo institucional ───────────────────────────────────────────────────
function InstitutionalLogo({ className = '' }) {
  return (
    <div className={`bg-[#34D399] rounded-lg flex items-center justify-center p-1.5 ${className}`}>
      <CalendarDays className="text-[#001F12] w-full h-full" strokeWidth={2.5} />
    </div>
  )
}

// ─── LogoutModal ───────────────────────────────────────────────────────────
function LogoutModal({ onClose, onConfirm, loggingOut }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center
                    justify-center p-4">
      <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-2xl p-8 max-w-md w-full
                      text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30
                        flex items-center justify-center mx-auto mb-4">
          <LogOut className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          ¿Cerrar sesión?
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          Estás a punto de salir del panel de administración. ¿Deseas continuar?
        </p>
        <div className="space-y-3">
          <button
            type="button" onClick={onConfirm} disabled={loggingOut}
            className="w-full py-2.5 bg-red-600 text-white font-semibold
                       rounded-lg hover:bg-red-700 transition-colors
                       disabled:opacity-50"
          >
            {loggingOut ? 'Cerrando sesión...' : 'Sí, cerrar sesión'}
          </button>
          <button
            type="button" onClick={onClose}
            className="w-full py-2.5 text-gray-700 dark:text-gray-300 font-semibold
                       border border-gray-300 dark:border-emerald-900/40 rounded-lg hover:bg-gray-50 dark:hover:bg-emerald-900/20
                       transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

const SIDEBAR_ITEMS = [
  { label: 'Panel de control', path: '/admin/dashboard',   icon: LayoutDashboard },
  { label: 'Jornada',          path: '/admin/jornada',     icon: CalendarDays },
  { label: 'Escenarios',       path: '/admin/escenarios',  icon: MapPin },
  { label: 'Sesiones',         path: '/admin/sesiones',    icon: ListVideo },
  { label: 'Propuestas',       path: '/admin/propuestas',  icon: FileText },
  { label: 'Estudiantes',      path: '/admin/estudiantes', icon: Users },
  { label: 'Reportes',         path: '/admin/reportes',    icon: BarChart3 },
]

function Sidebar({ navigate, location, open, onClose, user, onLogoutClick, onToggleDark, onDarkMode, onOpenSearch, isSuperAdmin }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#001F12] flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 border-r border-white/5
      `}>

        {/* Logo Section */}
        <div className="px-6 py-8 flex items-center gap-3">
          <InstitutionalLogo className="w-10 h-10" />
          <div className="min-w-0">
            <p className="text-white font-extrabold text-[15px] tracking-tight leading-none truncate">UESSJR</p>
            <p className="text-[#34D399] font-bold text-[10px] tracking-wider uppercase mt-1">Agenda Admin</p>
          </div>
        </div>

        {/* Search Shortcut Hint */}
        <div className="px-4 mb-4">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
          >
            <div className="flex items-center gap-3 text-white/40 group-hover:text-white/70">
              <Search size={16} />
              <span className="text-xs font-bold tracking-tight">Buscador...</span>
            </div>
            <kbd className="px-1.5 py-0.5 bg-black/40 border border-white/10 rounded text-[9px] font-black text-white/30 uppercase">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 py-2 overflow-y-auto scrollbar-hide">
          <p className="px-3 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">Menú de gestión</p>
          <nav className="space-y-1">
            {SIDEBAR_ITEMS.map(item => {
              const isActive = location.pathname.startsWith(item.path)
              const Icon = item.icon
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => { navigate(item.path); onClose() }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-3 group relative
                    ${isActive
                      ? 'bg-[#1B4332] text-white font-bold'
                      : 'text-white/50 hover:text-white/90 hover:bg-white/5'}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#34D399]' : 'text-white/20 group-hover:text-white/40'}`} />
                  <span className="tracking-wide text-[13px]">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1 h-1 rounded-full bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                  )}
                </button>
              )
            })}

            {isSuperAdmin && (
              <div className="pt-4 mt-4 border-t border-white/5">
                <p className="px-3 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">Administración</p>
                <button
                  type="button"
                  onClick={() => { navigate('/admin/equipo'); onClose() }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-3 group relative
                    ${location.pathname === '/admin/equipo'
                      ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30'
                      : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  <span className="tracking-wide text-[13px]">Gestión de equipo</span>
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="border-t border-white/5 p-4 space-y-3 bg-black/20">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded-xl bg-[#34D399] flex items-center justify-center font-bold text-[#001F12] text-xs shrink-0">
              {user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-[9px] text-white/20 font-black uppercase tracking-widest leading-none mb-1">Administrador</p>
              <p className="text-[11px] text-white/60 truncate font-bold">{user?.email || 'admin@umb.edu.mx'}</p>
            </div>
          </div>

          {/* Dark / Light toggle */}
          <button
            type="button"
            onClick={onToggleDark}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
          >
            {onDarkMode
              ? <Sun className="w-4 h-4 shrink-0 text-amber-400" />
              : <Moon className="w-4 h-4 shrink-0 opacity-60" />
            }
            <span className="font-bold text-xs uppercase tracking-widest">
              {onDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { onLogoutClick(); onClose() }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/40 hover:text-white/80 hover:bg-red-500/10 hover:text-red-400 transition-all group border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-4 h-4 shrink-0 opacity-50 group-hover:opacity-100" />
            <span className="font-bold text-xs uppercase tracking-widest">Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default function AdminLayout() {
  const navigate     = useNavigate()
  const location     = useLocation()
  const { user, signOut, isSuperAdmin } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setShowCommandPalette(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('uessjr-dark')
      if (saved !== null) return saved === 'true'
    } catch (e) {}
    return document.documentElement.classList.contains('dark')
  })

  const toggleDark = useCallback(() => {
    const html = document.documentElement
    const next = !html.classList.contains('dark')
    html.classList.toggle('dark', next)
    setDarkMode(next)
    try { localStorage.setItem('uessjr-dark', String(next)) } catch (e) {}
  }, [])

  const handleLogoutClick = () => {
    setShowLogoutModal(true)
  }

  const handleLogoutConfirm = async () => {
    try {
      setLoggingOut(true)
      await signOut()
      setShowLogoutModal(false)
      navigate('/')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F2F5F3] dark:bg-[#0A1A11]">
      <ScrollToTop />
      {/* Mobile topbar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-[#001F12] z-40 flex items-center justify-between px-4 lg:hidden border-b border-white/5">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="text-white p-2 rounded-lg hover:bg-white/10"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="ml-3 flex items-center gap-2">
            <InstitutionalLogo className="w-7 h-7" />
            <span className="text-white font-bold text-sm tracking-tight">UESSJR Agenda</span>
          </div>
        </div>
        
        <button 
          onClick={() => setShowCommandPalette(true)}
          className="p-2 text-white/70 hover:text-white transition-colors"
        >
          <Search size={20} />
        </button>
      </div>

      <Sidebar
        navigate={navigate}
        location={location}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogoutClick={handleLogoutClick}
        onToggleDark={toggleDark}
        onDarkMode={darkMode}
        onOpenSearch={() => setShowCommandPalette(true)}
        isSuperAdmin={isSuperAdmin}
      />

      <div className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-w-0">
        <Outlet />
      </div>

      {showLogoutModal && (
        <LogoutModal
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleLogoutConfirm}
          loggingOut={loggingOut}
        />
      )}

      {/* FAB búsqueda – solo móvil */}
      <button
        onClick={() => setShowCommandPalette(true)}
        aria-label="Abrir buscador"
        className="fixed bottom-6 right-6 z-30 lg:hidden w-14 h-14 bg-[#1B4332] text-white rounded-full shadow-xl flex items-center justify-center hover:bg-emerald-700 active:scale-90 transition-all"
      >
        <Search size={22} />
      </button>

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />
    </div>
  )
}

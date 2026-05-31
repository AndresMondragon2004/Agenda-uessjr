import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { sesionesService } from '../../services/sesiones.service'
import ScrollToTop from '../ui/ScrollToTop'

export default function AuthLayout({ children }) {
  const location = useLocation()
  const isLogin = location.pathname === '/login'

  const [loadingSessions, setLoadingSessions] = useState(true)
  const [sessionCards, setSessionCards] = useState([])

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoadingSessions(true)
        const data = await sesionesService.getAll()
        if (data && data.length >= 3) {
          setSessionCards([
            { tipo: data[0].tipo || 'SESIÓN', nombre: data[0].nombre },
            { tipo: data[1].tipo || 'SESIÓN', nombre: data[1].nombre },
            { tipo: data[2].tipo || 'SESIÓN', nombre: data[2].nombre },
          ])
        }
      } catch (err) {
        console.error('Error cargando sesiones para AuthLayout', err)
      } finally {
        setLoadingSessions(false)
      }
    }
    loadSessions()
  }, [])

  return (
    <div className="h-screen w-full flex bg-white dark:bg-[#0A1A11] font-sans overflow-hidden">
      <ScrollToTop />
      {/* Left Panel - Branding (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1b3b2b] flex-col justify-between p-8 xl:p-12 relative h-full">
        
        {/* Logo */}
        <div className="z-10 flex-shrink-0">
          <h1 className="text-white text-xl xl:text-2xl font-bold tracking-tight">
            UESSJR AGENDA
          </h1>
        </div>

        {/* Center Content */}
        <div className="z-10 flex-1 flex flex-col justify-center max-w-lg py-4">
          <div className="text-[#e0a96d] text-4xl xl:text-6xl font-serif font-bold mb-2 xl:mb-4 leading-none">
            ”
          </div>
          <h2 className="text-white text-3xl xl:text-4xl 2xl:text-5xl font-light italic leading-tight mb-6 xl:mb-10">
            Cultura que inspira, conocimiento<br />
            que<br />
            transforma.
          </h2>

          {/* Cards Stack */}
          <div className="relative h-40 xl:h-48 mt-2 xl:mt-4">
            {loadingSessions ? (
              <>
                <div className="absolute top-0 left-0 w-72 xl:w-80 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-lg animate-pulse h-[72px] xl:h-[84px]" />
                <div className="absolute top-8 xl:top-10 left-4 xl:left-6 w-72 xl:w-80 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg animate-pulse h-[72px] xl:h-[84px] z-10" />
                <div className="absolute top-16 xl:top-20 left-8 xl:left-12 w-72 xl:w-80 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl shadow-lg animate-pulse h-[72px] xl:h-[84px] z-20" />
              </>
            ) : (
              <>
                {/* Card 1 (Back) */}
                <div className="absolute top-0 left-0 w-72 xl:w-80 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 xl:p-4 shadow-lg transform transition-transform hover:-translate-y-1">
                  <p className="text-white/60 text-[10px] xl:text-xs font-semibold tracking-wider mb-1 uppercase">{sessionCards[0]?.tipo}</p>
                  <p className="text-white font-medium text-sm xl:text-base truncate">{sessionCards[0]?.nombre}</p>
                </div>
                {/* Card 2 (Middle) */}
                <div className="absolute top-8 xl:top-10 left-4 xl:left-6 w-72 xl:w-80 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 xl:p-4 shadow-lg transform transition-transform hover:-translate-y-1 z-10">
                  <div className="w-1 h-6 xl:h-8 bg-[#e0a96d] absolute left-0 top-3 rounded-r-full"></div>
                  <p className="text-white/60 text-[10px] xl:text-xs font-semibold tracking-wider mb-1 uppercase pl-3">{sessionCards[1]?.tipo}</p>
                  <p className="text-white font-medium text-sm xl:text-base pl-3 truncate">{sessionCards[1]?.nombre}</p>
                </div>
                {/* Card 3 (Front) */}
                <div className="absolute top-16 xl:top-20 left-8 xl:left-12 w-72 xl:w-80 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 xl:p-4 shadow-lg transform transition-transform hover:-translate-y-1 z-20">
                  <p className="text-white/60 text-[10px] xl:text-xs font-semibold tracking-wider mb-1 uppercase">{sessionCards[2]?.tipo}</p>
                  <p className="text-white font-medium text-sm xl:text-base truncate">{sessionCards[2]?.nombre}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom Info */}
        <div className="z-10 flex-shrink-0">
          <p className="text-white font-medium text-sm xl:text-base">13va Jornada Académica y Cultural 2026</p>
          <p className="text-white/60 text-xs xl:text-sm mt-1">11 — 15 de mayo de 2026 · UES San José del Rincón</p>
        </div>
        
        {/* Optional decorative gradient/glow in the background */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#2a5a43] rounded-full blur-3xl opacity-50"></div>
      </div>

      {/* Right Panel - Form Area */}
      <div className="w-full lg:w-1/2 flex flex-col relative h-full">
        {/* Top Navigation */}
        <nav className="absolute top-0 left-0 right-0 p-8 flex justify-end gap-6 text-sm font-medium text-emerald-800/60 dark:text-emerald-400/50 hidden sm:flex z-10 bg-white/80 dark:bg-[#0A1A11]/90 backdrop-blur-md">
          <Link to="/" className="hover:text-emerald-900 transition-colors">Inicio</Link>
          <Link to="/agenda" className="hover:text-emerald-900 transition-colors">Agenda</Link>
          <Link to="/conferencistas" className="hover:text-emerald-900 transition-colors">Conferencistas</Link>
          <Link to="/proponer" className="hover:text-emerald-900 transition-colors">Proponer actividad</Link>
        </nav>

        {/* Scrollable Form Container */}
        <div className="flex-1 overflow-y-auto w-full flex flex-col pt-24 px-8 sm:px-16 lg:px-24">
          <div className="my-auto w-full max-w-md mx-auto pb-12">
            
            {/* Tabs */}
            {!location.pathname.includes('contrasena') && (
              <div className="flex border-b border-gray-200 dark:border-emerald-900/40 mb-10 w-full">
                <Link
                  to="/login"
                  className={`pb-4 px-2 text-sm font-semibold transition-colors relative ${
                    location.pathname === '/login' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Iniciar sesión
                  {location.pathname === '/login' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-emerald-400" />
                  )}
                </Link>
                <Link
                  to="/registro"
                  className={`pb-4 px-6 text-sm font-semibold transition-colors relative ${
                    location.pathname === '/registro' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Registrarse
                  {location.pathname === '/registro' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 dark:bg-emerald-400" />
                  )}
                </Link>
              </div>
            )}

            {children}

          </div>
        </div>
      </div>
    </div>
  )
}

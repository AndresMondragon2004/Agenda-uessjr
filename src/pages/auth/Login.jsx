import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Lock, Eye, EyeOff, Info, Moon, Sun, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import AuthLayout from '../../components/layout/AuthLayout'

export default function Login() {
  const { signIn, isAdmin, isLoggedIn, loading } = useAuth()
  const navigate = useNavigate()

  const [correo,          setCorreo]          = useState('')
  const [password,        setPassword]        = useState('')
  const [submitting,      setSubmitting]      = useState(false)
  const [error,           setError]           = useState(null)
  const [showPass,        setShowPass]        = useState(false)
  const [pendingRedirect, setPendingRedirect] = useState(false)

  useEffect(() => {
    if (error) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [error])

  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('uessjr-dark')
      if (saved !== null) return saved === 'true'
    } catch (e) {}
    return document.documentElement.classList.contains('dark')
  })

  const toggleDark = useCallback(() => {
    const html = document.documentElement
    html.classList.add('no-transition')
    const next = !html.classList.contains('dark')
    html.classList.toggle('dark', next)
    setDarkMode(next)
    try { localStorage.setItem('uessjr-dark', String(next)) } catch (e) {}
    requestAnimationFrame(() => html.classList.remove('no-transition'))
  }, [])

  useEffect(() => {
    // Si ya terminó de cargar el perfil y hay usuario, redirigimos
    if (pendingRedirect && !loading && isLoggedIn) {
      if (isAdmin) {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    }
  }, [pendingRedirect, loading, isLoggedIn, isAdmin, navigate])

  const handleLogin = async e => {
    e.preventDefault()
    if (!correo || !password) {
      setError('Ingresa tu correo o matrícula y contraseña.')
      return
    }
    
    // Si es una matrícula de 8 a 10 dígitos, la convertimos en correo institucional
    let emailToLogin = correo
    if (/^\d{8,10}$/.test(correo.trim())) {
      emailToLogin = `${correo.trim()}@umb.edu.mx`
    }

    try {
      setSubmitting(true)
      setError(null)
      await signIn(emailToLogin, password)
      setPendingRedirect(true)
      // No redirigimos aquí — dejamos que el useEffect detecte el cambio de rol
    } catch (err) {
      if (err.message === 'CUENTA_CONGELADA') {
        setError('Tu cuenta está congelada. Por favor, contacta al superadmin para restaurar tu acceso.')
      } else {
        setError('Credenciales incorrectas. Verifica tu información.')
      }
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="mb-6">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-[#1B4332] dark:hover:text-emerald-400 transition-colors uppercase tracking-widest"
        >
          <ArrowLeft size={14} /> Volver al inicio
        </Link>
      </div>

      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-tight tracking-tight">¡Te damos la bienvenida!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Ingresa tus credenciales para acceder a tu agenda personalizada.
          </p>
        </div>
        <button
          onClick={toggleDark}
          type="button"
          className="p-3 rounded-2xl bg-gray-50 dark:bg-[#0F2018] border border-gray-100 dark:border-emerald-900/50 text-gray-400 dark:text-gray-500 hover:text-[#1B4332] dark:hover:text-emerald-400 transition-all shadow-sm"
          title="Cambiar tema"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm rounded-r-lg flex items-start gap-3">
          <Info className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label htmlFor="input-correo" className="block text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider mb-2 uppercase">
            Matrícula o correo institucional
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <User size={16} />
            </div>
            <input
              id="input-correo"
              type="text"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
              placeholder="Ej. 13220024"
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#0F2018] border border-gray-100 dark:border-emerald-900/50 rounded-xl focus:bg-white dark:focus:bg-[#0F2018] focus:ring-2 focus:ring-[#1a3b2b] focus:border-transparent outline-none text-gray-900 dark:text-gray-300 text-sm transition-all"
            />
          </div>
        </div>

        <div>
          <label htmlFor="input-password" className="block text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider mb-2 uppercase">
            Contraseña
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Lock size={16} />
            </div>
            <input
              id="input-password"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-[#0F2018] border border-gray-100 dark:border-emerald-900/50 rounded-xl focus:bg-white dark:focus:bg-[#0F2018] focus:ring-2 focus:ring-[#1a3b2b] focus:border-transparent outline-none text-gray-900 dark:text-gray-300 text-sm transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end pt-2">
          <Link to="/recuperar-contrasena" className="text-sm font-medium text-[#e2a868] hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <button
          type="submit"
          disabled={submitting || loading}
          className="w-full py-3.5 bg-[#0d261a] text-white font-semibold rounded-xl hover:bg-[#163a2a] transition-all disabled:opacity-50 mt-4 shadow-lg shadow-[#0d261a]/20"
        >
          {submitting || loading ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
      </form>

      <div className="mt-16 text-center text-[10px] text-gray-400 dark:text-gray-600 font-medium tracking-wider uppercase">
        © 2026 UESSJR AGENDA.
      </div>
    </AuthLayout>
  )
}

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminLogin() {
  const { signIn, isAdmin, isLoggedIn, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [correo,          setCorreo]          = useState('')
  const [password,        setPassword]        = useState('')
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState(null)
  const [showPass,        setShowPass]        = useState(false)
  const [pendingRedirect, setPendingRedirect] = useState(false)

  // Wait for auth to finish loading, then verify admin role
  useEffect(() => {
    if (pendingRedirect && !authLoading && isLoggedIn) {
      if (isAdmin) {
        navigate('/admin/dashboard', { replace: true })
      } else {
        setError('Esta cuenta no tiene permisos de administrador.')
        setPendingRedirect(false)
      }
    }
  }, [pendingRedirect, authLoading, isLoggedIn, isAdmin, navigate])

  const handleSubmit = async e => {
    e.preventDefault()
    if (!correo || !password) {
      setError('Ingresa tu correo y contraseña.')
      return
    }
    try {
      setLoading(true)
      setError(null)
      await signIn(correo, password)
      setPendingRedirect(true)
    } catch (err) {
      if (err.message === 'CUENTA_CONGELADA') {
        setError('Tu cuenta está congelada. Por favor, contacta al superadmin para restaurar tu acceso.')
      } else {
        setError('Credenciales incorrectas o sin permisos de administrador.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="bg-white rounded-2xl shadow-2xl p-8">

          {/* Header */}
          <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shadow-inner">
              </div>
            <h1 className="text-xl font-bold text-gray-900">Panel de administración</h1>
            <p className="text-gray-400 text-sm mt-1">Acceso restringido al personal autorizado</p>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-amber-700 text-xs text-center">
            ⚠️ Esta área es exclusiva para administradores del sistema
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo institucional</label>
              <input
                type="email"
                value={correo}
                onChange={e => setCorreo(e.target.value)}
                placeholder="admin@uessjr.edu.mx"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-[#1B4332] outline-none text-base min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-[#1B4332] outline-none pr-12 text-base min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1B4332] text-white font-bold rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión como administrador'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <Link to="/login" className="text-sm text-gray-400 hover:text-[#1B4332] transition-colors">
              ¿Eres estudiante? Ir al acceso estudiantil
            </Link>
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">© 2026 UESSJR Agenda</p>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { Lock, Eye, EyeOff, Info, CheckCircle2, Save } from 'lucide-react'
import AuthLayout from '../../components/layout/AuthLayout'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading,         setLoading]         = useState(false)
  const [success,         setSuccess]         = useState(false)
  const [error,           setError]           = useState(null)
  const [showPass,        setShowPass]        = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [sessionReady,    setSessionReady]    = useState(false)

  useEffect(() => {
    // 1. Verificar si ya existe una sesión activa (por si el evento ya pasó)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true)
      }
    })

    // 2. Escuchar el evento específico
    const { data: { subscription } } = supabase.auth
      .onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
          setSessionReady(true)
        }
      })
    return () => subscription.unsubscribe()
  }, [])

  const getPasswordStrength = (pass) => {
    if (!pass) return { level: 0, label: '', color: 'bg-gray-200', textColor: 'text-gray-400' }
    let score = 0
    if (pass.length >= 8)          score++
    if (/[A-Z]/.test(pass))        score++
    if (/[0-9]/.test(pass))        score++
    if (/[^A-Za-z0-9]/.test(pass)) score++
    if (score <= 1) return { level: 1, label: 'Débil',  color: 'bg-red-500', textColor: 'text-red-500' }
    if (score <= 2) return { level: 2, label: 'Media',  color: 'bg-amber-500', textColor: 'text-amber-500' }
    if (score <= 3) return { level: 3, label: 'Buena',  color: 'bg-blue-500', textColor: 'text-blue-500' }
    return { level: 4, label: 'Segura', color: 'bg-emerald-500', textColor: 'text-emerald-500' }
  }
  
  const strength = getPasswordStrength(password)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!password) {
      setError('Ingresa tu nueva contraseña.')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.updateUser({
        password: password
      })
      if (error) throw error
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <AuthLayout>
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/20 animate-pulse">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-4xl font-black text-gray-900 dark:text-gray-100 mb-4 tracking-tight">¡Todo listo!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-10 font-medium">
          Tu contraseña ha sido actualizada. <br />
          Te redirigiremos en unos segundos...
        </p>
        
        <div className="w-full bg-gray-100 dark:bg-emerald-900/20 h-2 rounded-full mb-10 overflow-hidden">
          <div className="bg-[#1a3b2b] dark:bg-emerald-500 h-full rounded-full animate-[progress_3s_linear]" style={{ width: '100%' }}></div>
        </div>
        
        <Link to="/login"
              className="inline-block px-10 py-4 bg-[#0d261a] text-white font-bold rounded-2xl hover:bg-[#163a2a] transition-all shadow-xl shadow-emerald-900/30">
          Entrar ahora
        </Link>
        <style>{`
          @keyframes progress {
            0% { width: 0%; }
            100% { width: 100%; }
          }
        `}</style>
      </div>
    </AuthLayout>
  )

  if (!sessionReady) return (
    <AuthLayout>
      <div className="text-center py-24 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#1a3b2b]/10 border-t-[#1a3b2b] dark:border-emerald-500/10 dark:border-t-emerald-500 rounded-full animate-spin mb-8"></div>
        <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2 tracking-tight uppercase">Validando acceso</h3>
        <p className="text-gray-400 dark:text-gray-500 text-xs max-w-xs font-bold uppercase tracking-widest leading-loose">
          Estamos verificando tu token de seguridad para que puedas cambiar tu contraseña...
        </p>
      </div>
    </AuthLayout>
  )

  return (
    <AuthLayout>
      <div className="mb-10">
        <h2 className="text-4xl font-black text-gray-900 dark:text-gray-100 mb-3 tracking-tight">Nueva contraseña</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
          Crea una contraseña fuerte que no hayas usado antes.
        </p>
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 mb-8 flex items-start gap-4 animate-slide-in">
        <div className="bg-emerald-500 rounded-lg p-1.5 flex-shrink-0">
          <CheckCircle2 className="w-4 h-4 text-white" />
        </div>
        <p className="text-emerald-800 dark:text-emerald-400 text-xs font-bold leading-relaxed">
          Enlace verificado correctamente. Ya puedes elegir tu nueva clave de acceso.
        </p>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm rounded-r-2xl flex items-start gap-3">
          <Info className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <span className="font-bold">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-[0.2em] mb-3 uppercase">
            Nueva contraseña
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#1a3b2b] dark:group-focus-within:text-emerald-500 transition-colors">
              <Lock size={18} />
            </div>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-[#0F2018] border border-gray-100 dark:border-emerald-900/50 rounded-2xl focus:bg-white dark:focus:bg-[#0F2018] focus:ring-4 focus:ring-[#1a3b2b]/5 dark:focus:ring-emerald-500/5 focus:border-[#1a3b2b] dark:focus:border-emerald-500 outline-none text-gray-900 dark:text-gray-200 text-sm font-bold transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          
          {/* Strength bar */}
          {password && (
            <div className="mt-3">
              <div className="flex gap-2 mb-2">
                {[1, 2, 3, 4].map(n => (
                  <div key={n}
                       className={`h-1.5 flex-1 rounded-full transition-all duration-500
                         ${n <= strength.level ? strength.color : 'bg-gray-100 dark:bg-emerald-900/20'}`} />
                ))}
              </div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${strength.textColor} transition-colors text-right`}>
                {strength.label}
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-[0.2em] mb-3 uppercase">
            Confirmar nueva contraseña
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#1a3b2b] dark:group-focus-within:text-emerald-500 transition-colors">
              <Lock size={18} />
            </div>
            <input
              type={showConfirmPass ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repite tu contraseña"
              className={`w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-[#0F2018] border rounded-2xl focus:bg-white dark:focus:bg-[#0F2018] focus:ring-4 outline-none text-gray-900 dark:text-gray-200 text-sm font-bold transition-all
                ${confirmPassword && password !== confirmPassword 
                  ? 'border-red-300 focus:ring-red-500/5 focus:border-red-500' 
                  : 'border-gray-100 dark:border-emerald-900/50 focus:ring-[#1a3b2b]/5 focus:border-[#1a3b2b] dark:focus:border-emerald-500'}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPass(!showConfirmPass)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[#0d261a] text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-[#163a2a] transition-all disabled:opacity-50 shadow-2xl shadow-emerald-900/30 flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <><Save size={16} /> Actualizar contraseña</>
          )}
        </button>
      </form>

      <div className="mt-16 pt-8 border-t border-gray-50 dark:border-emerald-900/20 text-center">
        <p className="text-[10px] text-gray-400 dark:text-gray-600 font-black tracking-widest uppercase">
          © 2026 UESSJR AGENDA.
        </p>
      </div>
    </AuthLayout>
  )
}

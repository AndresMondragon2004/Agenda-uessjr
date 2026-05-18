import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { gasService } from '../../services/gas.service'
import { Mail, Info, ArrowLeft, Send } from 'lucide-react'
import AuthLayout from '../../components/layout/AuthLayout'

export default function ForgotPassword() {
  const [correo,   setCorreo]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const [enviado,  setEnviado]  = useState(false)
  const [error,    setError]    = useState(null)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!correo) {
      setError('Ingresa tu correo electrónico.')
      return
    }
    if (!/\S+@\S+\.\S+/.test(correo)) {
      setError('El correo no es válido.')
      return
    }
    try {
      setLoading(true)
      setError(null)
      const redirectTo = `${window.location.origin}/nueva-contrasena`;
      
      const { error } = await supabase.auth
        .resetPasswordForEmail(correo, {
          redirectTo: redirectTo
        })
      if (error) throw error

      // Enviar correo bonito vía GAS
      // Nota: Supabase enviará su propio correo también a menos que se configure lo contrario
      await gasService.sendEmail({
        to: correo,
        subject: 'Restablecer tu contraseña - UESSJR',
        type: 'RESET_PASSWORD',
        data: {
          first_name: 'Estudiante',
          confirmation_url: redirectTo
        }
      });

      setEnviado(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (enviado) return (
    <AuthLayout>
      <div className="text-center py-8">
        <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/10 rotate-3">
          <Mail className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-4 tracking-tight">¡Correo enviado!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
          Hemos enviado un enlace de recuperación a <br />
          <strong className="text-gray-900 dark:text-gray-200 font-bold">{correo}</strong>
        </p>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4 mb-8">
          <p className="text-amber-800 dark:text-amber-400 text-xs font-bold uppercase tracking-widest">
            ⚠️ Revisa tu carpeta de Spam
          </p>
          <p className="text-amber-700/70 dark:text-amber-400/70 text-[10px] mt-1">
            El enlace expira en 60 minutos
          </p>
        </div>

        <div className="space-y-4">
          <Link to="/login"
                className="block w-full px-8 py-4 bg-[#0d261a] text-white font-bold rounded-2xl hover:bg-[#163a2a] transition-all shadow-xl shadow-emerald-900/20">
            Volver al inicio de sesión
          </Link>
          <button 
            onClick={() => setEnviado(false)}
            className="text-sm font-bold text-[#e2a868] hover:text-[#d49757] transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            ¿No recibiste nada? Intentar de nuevo
          </button>
        </div>
      </div>
    </AuthLayout>
  )

  return (
    <AuthLayout>
      <div className="mb-10">
        <Link to="/login" className="inline-flex items-center text-xs font-black uppercase tracking-widest text-gray-400 hover:text-[#0d261a] dark:hover:text-emerald-400 mb-8 transition-colors group">
          <ArrowLeft size={14} className="mr-2 transition-transform group-hover:-translate-x-1" /> Volver atrás
        </Link>
        <h2 className="text-4xl font-black text-gray-900 dark:text-gray-100 mb-3 tracking-tight">Recuperar acceso</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
          No te preocupes, sucede. Ingresa tu correo y te ayudaremos a volver.
        </p>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm rounded-r-2xl flex items-start gap-3 animate-shake">
          <Info className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-[0.2em] mb-3 uppercase">
            Correo Institucional
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#0d261a] dark:group-focus-within:text-emerald-500 transition-colors">
              <Mail size={18} />
            </div>
            <input
              type="email"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
              placeholder="nombre@umb.edu.mx"
              className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-[#0F2018] border border-gray-100 dark:border-emerald-900/50 rounded-2xl focus:bg-white dark:focus:bg-[#0F2018] focus:ring-4 focus:ring-[#0d261a]/5 dark:focus:ring-emerald-500/5 focus:border-[#0d261a] dark:focus:border-emerald-500 outline-none text-gray-900 dark:text-gray-200 text-sm font-bold transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
            />
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
            <><Send size={16} /> Enviar instrucciones</>
          )}
        </button>
      </form>

      <div className="mt-12 pt-8 border-t border-gray-50 dark:border-emerald-900/20 text-center">
        <p className="text-[10px] text-gray-400 dark:text-gray-600 font-black tracking-widest uppercase">
          © 2026 UESSJR AGENDA.
        </p>
      </div>
    </AuthLayout>
  )
}

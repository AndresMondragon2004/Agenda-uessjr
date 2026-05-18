import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Info, User, Mail, BookOpen, Lock, Sun, Moon, Phone } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import AuthLayout from '../../components/layout/AuthLayout'

export default function Register() {
  const { signUp } = useAuth()
  const navigate   = useNavigate()

  const [form, setForm] = useState({
    nombre:             '',
    apellidos:          '',
    matricula:          '',
    correo:             '',
    telefono:           '',
    programa_academico: '',
    password:           '',
    confirmPassword:    '',
  })
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [success,  setSuccess]  = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)

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

  const handleChange = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const getPasswordStrength = (pass) => {
    if (!pass) return { level: 0, label: '', color: 'bg-gray-200', textColor: 'text-gray-400' }
    let score = 0
    if (pass.length >= 8)          score++
    if (/[A-Z]/.test(pass))        score++
    if (/[0-9]/.test(pass))        score++
    if (/[^A-Za-z0-9]/.test(pass)) score++
    if (score <= 1) return { level: 1, label: 'Débil',  color: 'bg-red-600', textColor: 'text-red-600' }
    if (score <= 2) return { level: 2, label: 'Media',  color: 'bg-amber-500', textColor: 'text-amber-600' }
    if (score <= 3) return { level: 3, label: 'Buena',  color: 'bg-blue-500', textColor: 'text-blue-600' }
    return { level: 4, label: 'Segura', color: 'bg-emerald-600', textColor: 'text-emerald-600' }
  }

  const strength = getPasswordStrength(form.password)

  const handleSubmit = async e => {
    e.preventDefault()

    if (!form.nombre || !form.apellidos || !form.matricula ||
        !form.correo || !form.telefono || !form.programa_academico || !form.password) {
      setError('Completa todos los campos obligatorios.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await signUp(form.correo, form.password, {
        nombre:             form.nombre,
        apellidos:          form.apellidos,
        matricula:          form.matricula,
        telefono:           form.telefono,
        programa_academico: form.programa_academico,
      })
      setSuccess(true)
    } catch (err) {
      if (err.message.includes('already registered')) {
        setError('Este correo ya está registrado.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <AuthLayout>
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-bounce">
          <span className="text-4xl">✅</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">¡Registro exitoso!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Tu cuenta ha sido creada correctamente. Ya puedes acceder al sistema con tus credenciales.
        </p>
        <Link to="/login"
              className="inline-block px-10 py-4 bg-[#0d261a] text-white font-bold rounded-2xl hover:bg-[#163a2a] transition-all shadow-xl shadow-emerald-900/30 transform hover:scale-105 active:scale-95">
          Ir a iniciar sesión
        </Link>
      </div>
    </AuthLayout>
  )

  return (
    <AuthLayout>
      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">Crea tu cuenta</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
        Regístrate para inscribirte a sesiones y llevar tu agenda personalizada.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm rounded-r-lg flex items-start gap-3">
          <Info className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Nombre + Apellidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider mb-2 uppercase">Nombre(s) *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <User size={16} />
              </div>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ej. Andrés"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#0F2018] border border-gray-100 dark:border-emerald-900/50 rounded-xl focus:bg-white dark:focus:bg-[#0F2018] focus:ring-2 focus:ring-[#1a3b2b] focus:border-transparent outline-none text-gray-900 dark:text-gray-300 text-sm transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider mb-2 uppercase">Apellidos *</label>
            <div className="relative">
              <input
                name="apellidos"
                value={form.apellidos}
                onChange={handleChange}
                placeholder="Ej. Mondragón Tenorio"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0F2018] border border-gray-100 dark:border-emerald-900/50 rounded-xl focus:bg-white dark:focus:bg-[#0F2018] focus:ring-2 focus:ring-[#1a3b2b] focus:border-transparent outline-none text-gray-900 dark:text-gray-300 text-sm transition-all"
              />
            </div>
          </div>
        </div>

        {/* Matrícula */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-bold text-gray-500 tracking-wider uppercase">Matrícula *</label>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <span className="font-semibold text-xs border border-gray-300 rounded px-1">ID</span>
            </div>
            <input
              name="matricula"
              value={form.matricula}
              onChange={handleChange}
              placeholder="Ej. 13220024"
              className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-[#0F2018] border border-gray-100 dark:border-emerald-900/50 rounded-xl focus:bg-white dark:focus:bg-[#0F2018] focus:ring-2 focus:ring-[#1a3b2b] focus:border-transparent outline-none text-gray-900 dark:text-gray-300 text-sm transition-all"
            />
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400" title="Tu matrícula es el número de 8 dígitos de tu credencial institucional">
              <Info size={16} />
            </div>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 italic">Tu matrícula es el número de 8 dígitos de tu credencial institucional</p>
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-xs font-bold text-gray-500 tracking-wider mb-2 uppercase">Número de WhatsApp *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Phone size={16} />
            </div>
            <input
              type="tel"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              placeholder="Ej. 7121234567"
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#0F2018] border border-gray-100 dark:border-emerald-900/50 rounded-xl focus:bg-white dark:focus:bg-[#0F2018] focus:ring-2 focus:ring-[#1a3b2b] focus:border-transparent outline-none text-gray-900 dark:text-gray-300 text-sm transition-all"
            />
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 italic">Para enviarte tu QR de acceso y recordatorios</p>
        </div>

        {/* Correo */}
        <div>
          <label className="block text-xs font-bold text-gray-500 tracking-wider mb-2 uppercase">Correo institucional *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Mail size={16} />
            </div>
            <input
              type="email"
              name="correo"
              value={form.correo}
              onChange={handleChange}
              placeholder="tumatricula@umb.edu.mx"
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#0F2018] border border-gray-100 dark:border-emerald-900/50 rounded-xl focus:bg-white dark:focus:bg-[#0F2018] focus:ring-2 focus:ring-[#1a3b2b] focus:border-transparent outline-none text-gray-900 dark:text-gray-300 text-sm transition-all"
            />
          </div>
        </div>

        {/* Programa */}
        <div>
          <label className="block text-xs font-bold text-gray-500 tracking-wider mb-2 uppercase">Programa académico *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 z-10">
              <BookOpen size={16} />
            </div>
            <select
              name="programa_academico"
              value={form.programa_academico}
              onChange={handleChange}
              className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-[#0F2018] border border-gray-100 dark:border-emerald-900/50 rounded-xl focus:bg-white dark:focus:bg-[#0F2018] focus:ring-2 focus:ring-[#1a3b2b] focus:border-transparent outline-none text-gray-900 dark:text-gray-300 text-sm appearance-none transition-all cursor-pointer"
            >
              <option value="">Selecciona tu programa...</option>
              <option value="sistemas">Ing. en sistemas computacionales</option>
              <option value="innovacion_agricola">Ing. en innovación agrícola sustentable</option>
              <option value="contaduria">Licenciatura en contaduría</option>
              <option value="docente">Docente UES San José del Rincón</option>
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider mb-2 uppercase">Contraseña *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock size={16} />
              </div>
              <input
                type={showPass ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Mín. 8 caracteres"
                className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-[#0F2018] border border-gray-100 dark:border-emerald-900/50 rounded-xl focus:bg-white dark:focus:bg-[#0F2018] focus:ring-2 focus:ring-[#1a3b2b] focus:border-transparent outline-none text-gray-900 dark:text-gray-300 text-sm transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider mb-2 uppercase">Confirmar contraseña *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock size={16} />
              </div>
              <input
                type={showConfirmPass ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repetir contraseña"
                className={`w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-[#0F2018] border rounded-xl focus:bg-white dark:focus:bg-[#0F2018] focus:ring-2 focus:ring-[#1a3b2b] focus:border-transparent outline-none text-gray-900 dark:text-gray-300 text-sm transition-all
                  ${form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800/50 focus:ring-red-400' : 'border-gray-100 dark:border-emerald-900/50'}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Strength bar */}
        {form.password && (
          <div className="mt-1">
            <div className="flex gap-1.5 mb-2">
              {[1, 2, 3, 4].map(n => (
                <div key={n}
                     className={`h-1 flex-1 rounded-full transition-all duration-300
                       ${n <= strength.level ? strength.color : 'bg-gray-200 dark:bg-emerald-900/30'}`} />
              ))}
            </div>
            <p className={`text-[11px] font-medium ${strength.textColor} transition-colors`}>
              Seguridad de la contraseña: {strength.label}
            </p>
          </div>
        )}

        <label className="flex items-start gap-3 mt-4 cursor-pointer group">
          <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-gray-300 text-[#1a3b2b] focus:ring-[#1a3b2b] transition-colors" />
          <span className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
            Acepto los <Link to="/terminos" className="text-[#e2a868] font-medium hover:underline">términos y condiciones</Link> y el <Link to="/privacidad" className="text-[#e2a868] font-medium hover:underline">aviso de privacidad</Link>
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-[#0d261a] text-white font-semibold rounded-xl hover:bg-[#163a2a] transition-all disabled:opacity-50 mt-4 shadow-lg shadow-[#0d261a]/20"
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>

      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-[#e2a868] font-semibold hover:underline">
            Inicia sesión
          </Link>
        </p>
        <p className="text-[10px] text-gray-400 dark:text-gray-600 font-medium tracking-wider uppercase mt-8">
          © 2026 UESSJR AGENDA.
        </p>
      </div>
    </AuthLayout>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, ArrowRight, Loader2, GraduationCap } from 'lucide-react'
import SEO from '../../components/SEO'

export default function SpeakerAccess() {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleAccess = (e) => {
    e.preventDefault()
    if (!token.trim()) return
    
    setLoading(true)
    let finalToken = token.trim()
    
    // Si el usuario pegó la URL completa por error, extraemos el token
    if (finalToken.includes('/ponente/')) {
      finalToken = finalToken.split('/ponente/').pop()
    }

    setTimeout(() => {
      navigate(`/ponente/${finalToken}`)
    }, 500)
  }

  return (
    <>
      <SEO title="Acceso a Ponentes" />
      <div className="min-h-screen bg-gray-50 dark:bg-[#0A1A11] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#1B4332] flex items-center justify-center shadow-lg">
              <GraduationCap className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Portal de Ponentes
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Ingresa tu código de acceso único para gestionar tu sesión.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-[#122A1C] py-8 px-4 shadow-xl border border-gray-100 dark:border-emerald-900/40 sm:rounded-3xl sm:px-10">
            <form className="space-y-6" onSubmit={handleAccess}>
              <div>
                <label htmlFor="token" className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                  Código de acceso
                </label>
                <div className="mt-2 relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="token"
                    name="token"
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-emerald-900/50 rounded-xl focus:ring-[#1B4332] focus:border-[#1B4332] outline-none sm:text-sm bg-gray-50 dark:bg-emerald-950/20 text-gray-900 dark:text-white placeholder-gray-400 transition-all font-mono"
                    placeholder="Ej. a1b2c3d4-..."
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || !token.trim()}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#1B4332] hover:bg-emerald-800 focus:outline-none transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Ingresar al portal <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

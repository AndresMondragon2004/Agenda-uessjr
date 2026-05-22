import { useState, useEffect } from 'react'
import { jornadaService } from '../../services/jornada.service'
import { parseSafeDate } from '../../utils/dateHelper'

// Importar las 3 vistas del ciclo de vida
import PreEventView    from './landing/PreEventView'
import ActiveEventView from './landing/ActiveEventView'
import PostEventView   from './landing/PostEventView'

export default function Landing() {
  const [jornada, setJornada] = useState(null)
  const [loading, setLoading] = useState(true)
  const [state,   setState]   = useState('LOADING') // 'PRE' | 'ACTIVE' | 'POST' | 'LOADING'

  useEffect(() => {
    async function cargar() {
      try {
        const j = await jornadaService.getActiva()
        setJornada(j)
        
        if (!j) {
          setState('PRE') // O un estado por defecto si no hay jornada activa
          return
        }

        const ahora = new Date()
        
        // Configurar fechas límites (asegurando comparación correcta cross-browser)
        const inicio = parseSafeDate(j.fecha_inicio, '00:00:00')
        const fin    = parseSafeDate(j.fecha_fin, '23:59:59')

        if (ahora < inicio) {
          setState('PRE')
        } else if (ahora >= inicio && ahora <= fin) {
          setState('ACTIVE')
        } else {
          setState('POST')
        }
      } catch (err) {
        console.error('Error en controlador de Landing:', err)
        setState('PRE') // Fallback
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#0D2B1D] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-amber-400 animate-spin" />
        <p className="text-white/50 font-bold text-xs uppercase tracking-widest">Iniciando Experiencia...</p>
      </div>
    </div>
  )

  // Renderizar la vista correspondiente según el estado
  switch (state) {
    case 'PRE':    return <PreEventView    jornada={jornada} />
    case 'ACTIVE': return <ActiveEventView jornada={jornada} />
    case 'POST':   return <PostEventView   jornada={jornada} />
    default:       return <ActiveEventView jornada={jornada} />
  }
}

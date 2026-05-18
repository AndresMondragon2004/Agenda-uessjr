import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'
import { generateConstanciaPDF } from '../../utils/pdfGenerator'

const TIPO_COLORS = {
  inauguracion: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  conferencia:  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  taller:       'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  cultural:     'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  protocolo:    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  competencia:  'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  cierre:       'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
}

const TIPO_LABELS = {
  inauguracion: 'Inauguración',
  conferencia:  'Conferencia',
  taller:       'Taller',
  cultural:     'Cultural',
  protocolo:    'Protocolo',
  competencia:  'Competencia',
  cierre:       'Cierre',
}

const IMAGENES_POR_DIA = {
  'Lunes':     '/images/imagenes_reporte/ajolote_lunes.jpg',
  'Martes':    '/images/imagenes_reporte/software_martes.jpg',
  'Miércoles': '/images/imagenes_reporte/manualidades_miercoles.jpg',
  'Jueves':    '/images/imagenes_reporte/computacion_jueves.jpg',
  'Viernes':   '/images/imagenes_reporte/robots_viernes.jpg',
}

export default function MyAgenda() {
  const { estudiante } = useAuth()

  const [inscripciones, setInscripciones] = useState([])
  const [asistencias,   setAsistencias]   = useState([])
  const [loading,       setLoading]       = useState(true)
  const [generating,    setGenerating]    = useState(false)
  const [jornada,       setJornada]       = useState(null)
  const [cancelando,    setCancelando]    = useState(null)
  const [confirmando,   setConfirmando]   = useState(null)
  const [toast,         setToast]         = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  useEffect(() => {
    if (!estudiante?.id) {
      setLoading(false)
      return
    }
    cargarDatos()
  }, [estudiante])

  async function cargarDatos() {
    try {
      setLoading(true)
      
      // 0. Cargar jornada activa
      const { data: jor } = await supabase.from('jornadas').select('*').eq('estado', 'activa').maybeSingle()
      setJornada(jor)

      // 1. Cargar inscripciones
      const { data: insc, error: iErr } = await supabase
        .from('inscripciones')
        .select(`
          id, sesion_id, estado, created_at,
          sesiones (
            id, nombre, tipo, hora_inicio, hora_fin,
            ponente_nombre, ponente_grado,
            escenarios ( nombre ),
            dias_jornada ( fecha, nombre_dia, imagen_url )
          )
        `)
        .eq('estudiante_id', estudiante.id)
        .order('created_at', { ascending: false })

      if (iErr) throw iErr
      setInscripciones(insc || [])

      // 2. Cargar asistencias reales
      const { data: asist, error: aErr } = await supabase
        .from('asistencias')
        .select('sesion_id')
        .eq('estudiante_id', estudiante.id)
      
      if (aErr) throw aErr
      setAsistencias(asist || [])

    } catch (err) {
      console.error('Error cargando agenda:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDescargarConstancia = async () => {
    if (!jornada || !estudiante) return
    try {
      setGenerating(true)
      await generateConstanciaPDF(estudiante, jornada)
      showToast('Constancia generada con éxito')
    } catch (err) {
      console.error(err)
      alert('Error al generar la constancia')
    } finally {
      setGenerating(false)
    }
  }

  async function cancelarInscripcion(inscripcionId) {
    try {
      setCancelando(inscripcionId)
      const { error } = await supabase
        .from('inscripciones')
        .delete()
        .eq('id', inscripcionId)

      if (error) throw error
      setInscripciones(prev => prev.filter(i => i.id !== inscripcionId))
      showToast('Inscripción cancelada')
    } catch (err) {
      console.error('Error cancelando inscripción:', err)
    } finally {
      setCancelando(null)
    }
  }

  const checkAsistencia = (sesionId) => {
    return asistencias.some(a => a.sesion_id === sesionId)
  }

  // Agrupar inscripciones por día
  const agrupadas = inscripciones.reduce((acc, insc) => {
    const fecha = insc.sesiones?.dias_jornada?.fecha || 'sin-fecha'
    if (!acc[fecha]) acc[fecha] = { 
      dia: insc.sesiones?.dias_jornada, 
      inscripciones: [] 
    }
    acc[fecha].inscripciones.push(insc)
    return acc
  }, {})

  const diasOrdenados = Object.keys(agrupadas).sort()

  function formatDia(fecha) {
    if (fecha === 'sin-fecha') return 'Sin fecha asignada'
    return new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A1A11]">

      {/* Header */}
      <div className="bg-white dark:bg-[#122A1C] border-b border-gray-100 dark:border-emerald-900/40 px-4 sm:px-8 pt-28 pb-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-extrabold text-[#1B4332] dark:text-emerald-400">Mi agenda</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {estudiante
              ? `${estudiante.nombre} ${estudiante.apellidos} — Sesiones a las que estás inscrito(a).`
              : 'Tus sesiones inscritas.'}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1B4332] dark:border-emerald-500 mx-auto mb-3" />
              <p className="text-gray-400 dark:text-gray-500 text-sm">Cargando tu agenda...</p>
            </div>
          </div>
        ) : inscripciones.length === 0 ? (
          <div className="text-center py-24">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No tienes sesiones inscritas</h2>
            <p className="text-gray-400 dark:text-gray-500 mb-6">
              Explora la agenda y regístrate a las sesiones que te interesen.
            </p>
            <Link
              to="/agenda"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1B4332] text-white
                         font-semibold rounded-lg hover:bg-emerald-800 transition-colors"
            >
              Explorar agenda
            </Link>
          </div>
        ) : (
          <>
            {/* Summary bar */}
            <div className="bg-white dark:bg-[#122A1C] rounded-xl shadow-sm p-5 mb-8 flex flex-col sm:flex-row items-center justify-between border border-transparent dark:border-emerald-900/40 gap-4">
              <div className="flex gap-8">
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Inscripciones</p>
                  <p className="text-2xl font-bold text-[#1B4332] dark:text-emerald-400">{inscripciones.length}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Asistencias</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{asistencias.length}</p>
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                {asistencias.length > 0 && (
                  <button
                    onClick={handleDescargarConstancia}
                    disabled={generating}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-md shadow-emerald-900/10 flex items-center justify-center gap-2"
                  >
                    {generating ? <Loader2 size={16} className="animate-spin" /> : '🎓 Descargar Constancia'}
                  </button>
                )}
                <Link
                  to="/agenda"
                  className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-semibold text-[#1B4332] dark:text-emerald-400 border border-[#1B4332] dark:border-emerald-900/50 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors text-center"
                >
                  + Agregar sesiones
                </Link>
              </div>
            </div>

            {/* Sessions grouped by day */}
            <div className="space-y-12">
              {diasOrdenados.map(fecha => {
                const diaInfo = agrupadas[fecha].dia
                const inscs = agrupadas[fecha].inscripciones
                return (
                  <div key={fecha} className="space-y-6">
                    {/* Day Header Card with Thematic Image */}
                    <div className="relative h-24 sm:h-32 rounded-3xl overflow-hidden shadow-lg shadow-emerald-950/10 group mb-6">
                      {(diaInfo?.imagen_url || IMAGENES_POR_DIA[diaInfo?.nombre_dia]) ? (
                        <img 
                          src={diaInfo?.imagen_url || IMAGENES_POR_DIA[diaInfo?.nombre_dia]} 
                          alt={diaInfo?.nombre_dia}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 to-emerald-950" />
                      )}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
                      
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                        <h2 className="text-white text-lg sm:text-xl font-black uppercase tracking-widest drop-shadow-lg">
                          {formatDia(fecha)}
                        </h2>
                        <p className="text-emerald-300 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] drop-shadow-md mt-1">
                          {inscs.length} {inscs.length === 1 ? 'Sesión inscrita' : 'Sesiones inscritas'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {inscs
                        .sort((a, b) =>
                          (a.sesiones?.hora_inicio || '').localeCompare(b.sesiones?.hora_inicio || '')
                        )
                        .map(insc => {
                          const ses = insc.sesiones
                          if (!ses) return null
                          return (
                            <div key={insc.id}
                                 className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-sm border-l-4 border-[#1B4332] dark:border-emerald-600
                                            p-5 sm:p-6 hover:shadow-md transition-all">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">

                              {/* Time desktop */}
                              <div className="hidden sm:flex flex-col items-center justify-start shrink-0 w-16 pt-0.5">
                                <p className="font-bold text-[#1B4332] dark:text-emerald-400 text-base leading-none">
                                  {ses.hora_inicio?.slice(0, 5)}
                                </p>
                                <div className="w-px h-4 bg-gray-200 dark:bg-emerald-900/50 my-1" />
                                <p className="text-gray-400 dark:text-gray-500 text-xs">
                                  {ses.hora_fin?.slice(0, 5)}
                                </p>
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                {/* Mobile time */}
                                <div className="sm:hidden flex items-center gap-2 text-sm text-[#1B4332] dark:text-emerald-400 font-bold mb-2">
                                  <span>{ses.hora_inicio?.slice(0, 5)}</span>
                                  {ses.hora_fin && <span className="text-gray-400"> — {ses.hora_fin.slice(0, 5)}</span>}
                                </div>

                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase
                                    ${TIPO_COLORS[ses.tipo] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                                    {TIPO_LABELS[ses.tipo] || ses.tipo}
                                  </span>
                                  {ses.escenarios?.nombre && (
                                    <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-emerald-900" />
                                      {ses.escenarios.nombre}
                                    </span>
                                  )}
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base leading-snug mb-2 group-hover:text-[#1B4332] dark:group-hover:text-emerald-400 transition-colors">
                                  {ses.nombre}
                                </h3>

                                {/* Badge de Asistencia */}
                                {checkAsistencia(ses.id) ? (
                                  <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/30">
                                    <CheckCircle2 size={12} strokeWidth={3} /> Asistencia Registrada
                                  </div>
                                ) : (
                                  <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-gray-100 dark:border-gray-700">
                                    Pendiente de acceso
                                  </div>
                                )}

                                {ses.ponente_nombre && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                    <span className="font-bold text-gray-700 dark:text-gray-300">{ses.ponente_grado}</span> {ses.ponente_nombre}
                                  </p>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="shrink-0 flex flex-col gap-2 sm:min-w-[140px] pt-2 sm:pt-0">
                                <Link
                                  to={`/agenda/${ses.id}`}
                                  className="w-full flex items-center justify-center px-4 py-2.5 bg-[#1B4332] text-white text-xs font-bold
                                             rounded-xl hover:bg-emerald-800 transition-all shadow-sm"
                                >
                                  Ver detalles
                                </Link>
                                {confirmando === insc.id ? (
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => { cancelarInscripcion(insc.id); setConfirmando(null) }}
                                      disabled={cancelando === insc.id}
                                      className="flex-1 py-2.5 text-xs font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-all disabled:opacity-50 min-h-[40px]"
                                    >
                                      {cancelando === insc.id ? '...' : 'Sí, cancelar'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmando(null)}
                                      className="flex-1 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-emerald-900/40 rounded-xl hover:bg-gray-50 dark:hover:bg-emerald-900/20 transition-all min-h-[40px]"
                                    >
                                      Mantener
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmando(insc.id)}
                                    disabled={cancelando === insc.id}
                                    className="w-full px-4 py-2.5 text-xs font-bold text-red-500 border border-red-100 dark:border-red-900/30
                                               rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-all disabled:opacity-50"
                                  >
                                    Cancelar inscripción
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          )
                        })}
                    </div>
                  </div>
                )})}
            </div>
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 bg-emerald-600 text-white
                        px-6 py-3 rounded-xl shadow-lg text-sm font-semibold">
          ✓ {toast}
        </div>
      )}
    </div>
  )
}

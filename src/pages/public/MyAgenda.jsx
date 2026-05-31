import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Loader2, Users, Send, Clock, Ticket, Download, Trophy } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'
import { generateConstanciaPDF, generatePersonalAgendaPDF } from '../../utils/pdfGenerator'

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
  const [finalizada,    setFinalizada]    = useState(false)
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

      // 0. Cargar la jornada más reciente (activa o finalizada)
      const { data: jor } = await supabase
        .from('jornadas')
        .select('*')
        .order('fecha_inicio', { ascending: false })
        .limit(1)
        .maybeSingle()

      setJornada(jor)
      if (jor) {
        const hoy = new Date()
        const fin = new Date(jor.fecha_fin + 'T23:59:59')
        setFinalizada(hoy > fin || jor.estado === 'finalizada')
      }

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

  const handleDescargarAgendaPersonal = async () => {
    if (!jornada || !estudiante || inscripciones.length === 0) return
    try {
      setGenerating(true)
      await generatePersonalAgendaPDF(estudiante, jornada, inscripciones)
      showToast('Agenda personal generada')
    } catch (err) {
      console.error(err)
      alert(err.message || 'Error al generar la agenda')
    } finally {
      setGenerating(false)
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

  // ─── Estadísticas de Progreso ───
  const statsProgreso = (() => {
    // Solo sesiones donde el alumno está confirmado
    const inscripcionesConfirmadas = inscripciones.filter(i => i.estado === 'confirmada')
    if (inscripcionesConfirmadas.length === 0) return { asistidos: 0, total: 0, porcentaje: 0, programas: 0 }
    
    // Contar asistencias SOLO si existe una inscripción confirmada para esa sesión
    // Esto evita que asistencias 'coladas' inflen el porcentaje
    const asistidos = inscripcionesConfirmadas.filter(i => checkAsistencia(i.sesion_id)).length
    const total = inscripcionesConfirmadas.length
    
    // Limitar al 100% por seguridad
    const porcentaje = Math.min(100, Math.round((asistidos / total) * 100))
    
    const programas = new Set()
    inscripcionesConfirmadas.forEach(i => {
      if (checkAsistencia(i.sesion_id) && i.sesiones?.programa_academico) {
        // Asumiendo que programa_academico es un array o un string
        if (Array.isArray(i.sesiones.programa_academico)) {
          i.sesiones.programa_academico.forEach(p => programas.add(p))
        } else {
          programas.add(i.sesiones.programa_academico)
        }
      }
    })

    return { asistidos, total, porcentaje, programas: programas.size }
  })()

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

          {/* Acciones Rápidas de Acceso y Programación */}
          <div className="mt-6 flex flex-wrap gap-3">
            {!finalizada && (
              <Link
                to={`/ticket/${estudiante?.id}`}
                className="flex-1 sm:flex-none px-6 py-3 bg-[#1B4332] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:scale-95"
              >
                <Ticket size={14} /> Ver Mi Ticket (QR)
              </Link>
            )}

            {finalizada && (
              <div className="flex-1 sm:flex-none px-6 py-3 bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 border border-amber-200">
                <Trophy size={14} /> Evento Finalizado
              </div>
            )}

            {inscripciones.length > 0 && (
              <button
                onClick={handleDescargarAgendaPersonal}
                disabled={generating}
                className="flex-1 sm:flex-none px-6 py-3 bg-white dark:bg-[#0F2018] text-[#1B4332] dark:text-emerald-400 border-2 border-[#1B4332] dark:border-emerald-900/50 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-gray-50 dark:hover:bg-emerald-900/20 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {generating ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Descargar Agenda (PDF)
              </button>
            )}
            
            <Link
              to="/agenda"
              className="flex-1 sm:flex-none px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 border-2 border-gray-100 dark:border-emerald-900/30 rounded-xl hover:bg-gray-50 dark:hover:bg-emerald-900/20 transition-all text-center flex items-center justify-center"
            >
              Explorar más talleres
            </Link>
          </div>

          {/* Banner de Telegram para todos los usuarios sin vincular */}
          {!finalizada && estudiante && !estudiante.telegram_chat_id && (
            <div className="mt-6 bg-[#E8F4F8] dark:bg-[#0088cc]/10 border border-[#0088cc]/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#0088cc]/10 dark:bg-[#0088cc]/20 rounded-xl shrink-0 mt-0.5 sm:mt-0">
                  <Send className="text-[#0088cc]" size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 mb-1">Obtén tu código QR en Telegram</h3>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 leading-tight">
                    Vincula tu cuenta con nuestro bot oficial para tener tu boleto de acceso siempre a la mano y recibir notificaciones de tus sesiones. 
                    <Link to={`/ticket/${estudiante.id}`} className="ml-1 text-[#1B4332] dark:text-emerald-400 font-bold hover:underline">O ver ticket en la web →</Link>
                  </p>
                </div>
              </div>
              <a
                href={`https://t.me/agendauessjrbot?start=${estudiante.id}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-3 bg-[#0088cc] hover:bg-[#0077b5] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 shrink-0 transform hover:-translate-y-0.5"
              >
                Vincular Telegram
              </a>
            </div>
          )}
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
            {/* ─── PROGRESO DASHBOARD (PRO) ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
              {/* Tarjeta de Porcentaje */}
              <div className="lg:col-span-2 bg-[#1B4332] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-950/20">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-20 translate-x-20" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">Tu progreso</h2>
                      <p className="text-emerald-200/70 text-[10px] font-black uppercase tracking-widest mt-1">Jornada académica 2026</p>
                    </div>
                    <div className="text-right">
                      <span className="text-5xl font-black leading-none">{statsProgreso?.porcentaje}%</span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-3">
                    <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)] transition-all duration-1000"
                        style={{ width: `${statsProgreso?.porcentaje}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-emerald-100/60">
                      <span>Iniciado</span>
                      <span>{statsProgreso?.asistidos} de {statsProgreso?.total} sesiones completadas</span>
                      <span>Objetivo 100%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarjeta de Diversidad */}
              <div className="bg-white dark:bg-[#122A1C] rounded-[2.5rem] p-8 border border-gray-100 dark:border-emerald-900/30 shadow-sm flex flex-col justify-center text-center">
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="text-[#1B4332] dark:text-emerald-400" size={24} />
                </div>
                <p className="text-3xl font-black text-gray-900 dark:text-white leading-none mb-1">{statsProgreso?.programas}</p>
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Áreas cubiertas</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-4 leading-tight font-medium">Has explorado sesiones de {statsProgreso?.programas} programas diferentes.</p>
              </div>
            </div>

            {/* Summary bar (Compacta) */}
            <div className="bg-white dark:bg-[#122A1C] rounded-3xl shadow-sm p-6 mb-12 flex flex-col sm:flex-row items-center justify-between border border-gray-100 dark:border-emerald-900/40 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center shrink-0">
                  <CheckCircle2 className="text-emerald-500" size={24} />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 dark:text-white leading-tight">Certificación digital de asistencia</p>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Estado: {asistencias.length >= 6 ? 'Disponible' : 'No elegible aún'}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {asistencias.length >= 6 ? (
                  <button
                    onClick={handleDescargarConstancia}
                    disabled={generating}
                    className="flex-1 sm:flex-none px-8 py-3.5 bg-[#e2a868] hover:bg-[#d49757] text-[#0d261a] text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-amber-900/10 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:scale-95"
                  >
                    {generating ? <Loader2 size={16} className="animate-spin" /> : 'Descargar Constancia'}
                  </button>
                ) : (
                  <div className="px-5 py-3.5 bg-gray-50 dark:bg-[#0F2018] rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-400 border border-gray-100 dark:border-emerald-900/20 text-center flex items-center">
                    Completa {Math.max(0, 6 - asistencias.length)} sesiones más para habilitar
                  </div>
                )}
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
                                {insc.estado === 'lista_espera' ? (
                                  <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-900/30 animate-pulse">
                                    <Clock size={12} /> Lista de espera ⏳
                                  </div>
                                ) : checkAsistencia(ses.id) ? (
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
                                {!finalizada && (
                                  confirmando === insc.id ? (
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
                                  )
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

      {toast && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 bg-emerald-600 text-white
                        px-6 py-3 rounded-xl shadow-lg text-sm font-semibold">
          ✓ {toast}
        </div>
      )}
    </div>
  )
}

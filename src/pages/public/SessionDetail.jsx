import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Clock, MapPin, CalendarDays, Users, Share2, ChevronRight, CheckCircle2, Download, Star, X, MessageSquare, Send, ThumbsUp, BarChart, Briefcase, Heart, ThumbsDown, Smile } from 'lucide-react'
import { sesionesService } from '../../services/sesiones.service'
import { inscripcionesService } from '../../services/inscripciones.service'
import { useAuth }         from '../../context/AuthContext'
import { supabase }        from '../../services/supabase'

const TIPO_COLORS = {
  inauguracion: 'bg-blue-100   text-blue-800   dark:bg-blue-900/40   dark:text-blue-300',
  conferencia:  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  taller:       'bg-amber-100  text-amber-800  dark:bg-amber-900/40  dark:text-amber-300',
  cultural:     'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  protocolo:    'bg-gray-100   text-gray-700   dark:bg-gray-800/50   dark:text-gray-300',
  competencia:  'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  cierre:       'bg-rose-100   text-rose-800   dark:bg-rose-900/40   dark:text-rose-300',
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

const PROGRAMA_LABELS = {
  sistemas:            'Ing. sistemas',
  innovacion_agricola: 'Innovación agrícola',
  contaduria:          'Contaduría',
  publico_general:     'Público en general',
}

const IMAGENES_POR_DIA = {
  'Lunes':     '/images/imagenes_reporte/ajolote_lunes.jpg',
  'Martes':    '/images/imagenes_reporte/software_martes.jpg',
  'Miércoles': '/images/imagenes_reporte/manualidades_miercoles.jpg',
  'Jueves':    '/images/imagenes_reporte/computacion_jueves.jpg',
  'Viernes':   '/images/imagenes_reporte/robots_viernes.jpg',
}

export default function SessionDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { estudiante, isLoggedIn } = useAuth()

  const [sesion,         setSesion]         = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)
  const [totalInscritos, setTotalInscritos] = useState(0)
  const [yaInscrito,     setYaInscrito]     = useState(false)
  const [inscripcionEstado, setInscripcionEstado] = useState(null)
  const [yaAsistio,      setYaAsistio]      = useState(false)
  const [yaValoro,       setYaValoro]       = useState(false)
  const [valoracion,     setValoracion]     = useState({ estrellas: 0, comentario: '' })
  const [enviandoVal,    setEnviandoVal]    = useState(false)
  const [inscribiendo,   setInscribiendo]   = useState(false)
  const [finalizada,     setFinalizada]     = useState(false)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [toast,          setToast]          = useState(null)

  // Q&A
  const [preguntas, setPreguntas] = useState([])
  const [nuevaPregunta, setNuevaPregunta] = useState('')
  const [enviandoPregunta, setEnviandoPregunta] = useState(false)
  const [preguntasVotadas, setPreguntasVotadas] = useState(() => {
    try { return JSON.parse(localStorage.getItem('voted_preguntas') || '[]') } catch { return [] }
  })

  // Pro Features
  const [encuestas, setEncuestas] = useState([])
  const [encuestasVotadas, setEncuestasVotadas] = useState(() => {
    try { return JSON.parse(localStorage.getItem('voted_encuestas') || '[]') } catch { return [] }
  })
  const [encuestasOcultas, setEncuestasOcultas] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hidden_encuestas') || '[]') } catch { return [] }
  })
  const [compartioNetworking, setCompartioNetworking] = useState(false)


  useEffect(() => {
    if (error) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [error])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    async function cargar() {
      try {
        const data  = await sesionesService.getById(id)
        setSesion(data)
        
        // Verificar si la jornada ya terminó
        if (data.dias_jornada?.fecha) {
          const { data: jor } = await supabase.from('jornadas').select('fecha_fin').eq('id', data.jornada_id).single()
          if (jor) {
            const hoy = new Date()
            const fin = new Date(jor.fecha_fin + 'T23:59:59')
            setFinalizada(hoy > fin)
          }
        }

        // Usar RPC para obtener el conteo real (bypass RLS)
        const { data: conteos } = await supabase.rpc('get_inscritos_por_jornada', { jornada_uuid: data.jornada_id })
        const sesionConteo = (conteos || []).find(c => c.sesion_id === id)
        setTotalInscritos(sesionConteo ? Number(sesionConteo.total) : 0)

        if (estudiante?.id) {
          // 1. Verificar Inscripción
          const { data: insc } = await supabase
            .from('inscripciones')
            .select('id, estado')
            .eq('sesion_id', id)
            .eq('estudiante_id', estudiante.id)
            .maybeSingle()
          setYaInscrito(!!insc)
          setInscripcionEstado(insc?.estado || null)

          // 2. Verificar Asistencia (Check-in Staff)
          const { data: asist } = await supabase
            .from('asistencias')
            .select('id')
            .eq('sesion_id', id)
            .eq('estudiante_id', estudiante.id)
            .maybeSingle()
          setYaAsistio(!!asist)

          // 3. Verificar si ya calificó
          const { data: val } = await supabase
            .from('valoraciones')
            .select('estrellas, comentario')
            .eq('sesion_id', id)
            .eq('estudiante_id', estudiante.id)
            .maybeSingle()
            if (val) {
              setYaValoro(true)
              setValoracion({ estrellas: val.estrellas, comentario: val.comentario })
            }
          }

          // Cargar Preguntas (siempre visible para todos si la sesión es hoy o en vivo)
          
          // Cargar Encuestas
          const { data: encData } = await supabase.from('sesion_encuestas').select('*').eq('sesion_id', id).eq('estado', 'activa')
          if (encData) setEncuestas(encData)

          // Verificar Networking
          if (estudiante?.id) {
             const { data: net } = await supabase.from('sesion_networking').select('*').eq('sesion_id', id).eq('estudiante_id', estudiante.id).maybeSingle()
             setCompartioNetworking(!!net)
          }

          const { data: qData } = await supabase
            .from('sesion_preguntas')
            .select('id, pregunta, estado, votos, estudiantes(nombre)')
            .eq('sesion_id', id)
            .order('votos', { ascending: false })
            .order('created_at', { ascending: false })
          
          if (qData) setPreguntas(qData)

        } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [id, estudiante])

  useEffect(() => {
    if (!id) return
    const channel = supabase.channel(`public:sesion_encuestas:${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sesion_encuestas', filter: `sesion_id=eq.${id}` }, async () => {
         const { data: encData } = await supabase.from('sesion_encuestas').select('*').eq('sesion_id', id).eq('estado', 'activa')
         if (encData) setEncuestas(encData)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])


  const handleValorar = async () => {
    if (valoracion.estrellas === 0) {
      showToast('Por favor selecciona una calificación', 'error')
      return
    }
    try {
      setEnviandoVal(true)
      const { error: vErr } = await supabase
        .from('valoraciones')
        .insert([{
          estudiante_id: estudiante.id,
          sesion_id:     id,
          estrellas:     valoracion.estrellas,
          comentario:    valoracion.comentario
        }])
      if (vErr) throw vErr
      setYaValoro(true)
      showToast('¡Gracias por tu opinión!')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setEnviandoVal(false)
    }
  }

  const handleEnviarPregunta = async () => {
    if (!isLoggedIn || !estudiante) {
      showToast('Debes iniciar sesión para preguntar', 'error')
      return
    }
    if (!nuevaPregunta.trim()) return

    try {
      setEnviandoPregunta(true)
      const { data, error: qErr } = await supabase
        .from('sesion_preguntas')
        .insert([{
          sesion_id: id,
          estudiante_id: estudiante.id,
          pregunta: nuevaPregunta.trim()
        }])
        .select('id, pregunta, estado, votos, estudiantes(nombre)')
        .single()
      
      if (qErr) throw qErr
      setPreguntas([data, ...preguntas])
      setNuevaPregunta('')
      showToast('Pregunta enviada')
    } catch (err) {
      showToast('Error al enviar pregunta', 'error')
    } finally {
      setEnviandoPregunta(false)
    }
  }

  const toggleVote = async (preguntaId) => {
    if (!isLoggedIn) {
      showToast('Debes iniciar sesión para votar', 'error')
      return
    }

    const hasVoted = preguntasVotadas.includes(preguntaId)

    try {
      // Optimizacion optimista
      setPreguntas(prev => prev.map(p => p.id === preguntaId ? { ...p, votos: Math.max(0, p.votos + (hasVoted ? -1 : 1)) } : p))
      setPreguntasVotadas(prev => {
        const nuevos = hasVoted ? prev.filter(id => id !== preguntaId) : [...prev, preguntaId]
        localStorage.setItem('voted_preguntas', JSON.stringify(nuevos))
        return nuevos
      })

      const { error } = await supabase.rpc(hasVoted ? 'downvote_pregunta' : 'upvote_pregunta', { p_id: preguntaId })
      if (error) throw error
    } catch (err) {
      // Revertir
      setPreguntas(prev => prev.map(p => p.id === preguntaId ? { ...p, votos: Math.max(0, p.votos + (hasVoted ? 1 : -1)) } : p))
      setPreguntasVotadas(prev => {
        const revertidos = hasVoted ? [...prev, preguntaId] : prev.filter(id => id !== preguntaId)
        localStorage.setItem('voted_preguntas', JSON.stringify(revertidos))
        return revertidos
      })
      showToast('Error al procesar el voto', 'error')
    }
  }

  
  const handleCompartirPerfil = async () => {
    if (!isLoggedIn || !estudiante) { navigate('/login'); return }
    try {
      const { error } = await supabase.from('sesion_networking').insert([{ sesion_id: id, estudiante_id: estudiante.id }])
      if (error) throw error
      setCompartioNetworking(true)
      showToast('Perfil compartido exitosamente con el ponente')
    } catch (e) {
      showToast('Error al compartir perfil', 'error')
    }
  }

  const handleOcultarEncuesta = (encuestaId) => {
    const nuevas = [...encuestasOcultas, encuestaId]
    setEncuestasOcultas(nuevas)
    localStorage.setItem('hidden_encuestas', JSON.stringify(nuevas))
  }

  const handleVoteEncuesta = async (encuestaId, opcionIndex) => {
    if (!isLoggedIn || !estudiante) { navigate('/login'); return }
    if (encuestasVotadas.includes(encuestaId)) return

    try {
      const nuevasVotadas = [...encuestasVotadas, encuestaId]
      setEncuestasVotadas(nuevasVotadas)
      localStorage.setItem('voted_encuestas', JSON.stringify(nuevasVotadas))
      
      const { error } = await supabase.rpc('votar_encuesta', { p_encuesta_id: encuestaId, p_estudiante_id: estudiante.id, p_opcion_index: opcionIndex })
      if (error) throw error
    } catch (e) {
      showToast('Error al votar en encuesta', 'error')
    }
  }

  const sendReaction = (type) => {
    supabase.channel(`speaker_realtime:${id}`).send({
      type: 'broadcast',
      event: 'reaction',
      payload: { type }
    })
    showToast('¡Reacción enviada!', 'success')
  }

  const handleInscribirse = async () => {
    if (!isLoggedIn || !estudiante) { navigate('/login'); return }
    try {
      setInscribiendo(true)
      const res = await inscripcionesService.inscribir(estudiante.id, id)
      setYaInscrito(true)
      setInscripcionEstado(res.estado)
      if (res.estado === 'confirmada') {
        setTotalInscritos(prev => prev + 1) // Actualización optimista local
        showToast('¡Inscripción exitosa!')
      } else {
        showToast('Registrado en la lista de espera')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setInscribiendo(false)
    }
  }

  const handleCancelar = async () => {
    try {
      setInscribiendo(true)
      const { error: err } = await supabase
        .from('inscripciones')
        .delete()
        .eq('sesion_id', id)
        .eq('estudiante_id', estudiante.id)
      if (err) throw err
      setYaInscrito(false)
      const antEstado = inscripcionEstado
      setInscripcionEstado(null)
      if (antEstado === 'confirmada') {
        setTotalInscritos(prev => Math.max(0, prev - 1)) // Actualización optimista local
      }
      showToast('Inscripción cancelada')
    } catch (err) {
      showToast('Error al cancelar', 'error')
    } finally {
      setInscribiendo(false)
    }
  }

  const handleDownloadICS = () => {
    if (!sesion.dias_jornada?.fecha || !sesion.hora_inicio) return

    const fecha = sesion.dias_jornada.fecha.replace(/-/g, '')
    const hi    = (sesion.hora_inicio || '09:00:00').slice(0, 5).replace(':', '') + '00'
    const hf    = (sesion.hora_fin    || '10:00:00').slice(0, 5).replace(':', '') + '00'
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//UESSJR//Agenda//ES',
      'BEGIN:VEVENT',
      `DTSTART;TZID=America/Mexico_City:${fecha}T${hi}`,
      `DTEND;TZID=America/Mexico_City:${fecha}T${hf}`,
      `SUMMARY:${sesion.nombre}`,
      `DESCRIPTION:${sesion.descripcion || ''}`,
      `LOCATION:${sesion.escenarios?.nombre || 'UES SJR'}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n')

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.setAttribute('download', `sesion-${sesion.id}.ics`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B1310]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#0F5B3C]/20 dark:border-emerald-900/50 border-t-[#0F5B3C] dark:border-t-emerald-500 animate-spin" />
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Cargando sesión...</p>
      </div>
    </div>
  )

  if (error || !sesion) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B1310] px-4">
      <div className="text-center py-16 max-w-sm">
        <div className="w-20 h-20 bg-gray-100 dark:bg-[#122A1C] rounded-full flex items-center justify-center mx-auto mb-4">
          <CalendarDays className="w-10 h-10 text-gray-300 dark:text-emerald-900" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Sesión no encontrada</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Esta sesión no existe o fue eliminada.</p>
        <Link to="/agenda" className="px-6 py-2.5 bg-[#0F5B3C] text-white font-semibold rounded-xl hover:bg-emerald-800 transition-colors">
          Ver agenda
        </Link>
      </div>
    </div>
  )

  const fechaFormateada = sesion.dias_jornada?.fecha
    ? new Date(sesion.dias_jornada.fecha + 'T12:00:00')
        .toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const cupo  = sesion.escenarios?.capacidad_maxima || 0
  const pct   = cupo ? Math.min((totalInscritos / cupo) * 100, 100) : 0
  const lleno = cupo > 0 && totalInscritos >= cupo

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1310] pb-12">

      {/* Reactions Bar Flotante (Solo si la sesion no ha finalizado) */}
      {!finalizada && (
        <div className="fixed right-4 bottom-24 sm:bottom-8 z-50 flex flex-col gap-3">
          <button onClick={() => sendReaction('clap')} className="w-12 h-12 bg-white dark:bg-[#122A1C] rounded-full shadow-2xl border border-gray-100 dark:border-emerald-900/40 flex items-center justify-center text-2xl hover:scale-110 active:scale-90 transition-all">👏</button>
          <button onClick={() => sendReaction('mindblown')} className="w-12 h-12 bg-white dark:bg-[#122A1C] rounded-full shadow-2xl border border-gray-100 dark:border-emerald-900/40 flex items-center justify-center text-2xl hover:scale-110 active:scale-90 transition-all">🤯</button>
          <button onClick={() => sendReaction('heart')} className="w-12 h-12 bg-white dark:bg-[#122A1C] rounded-full shadow-2xl border border-gray-100 dark:border-emerald-900/40 flex items-center justify-center text-2xl hover:scale-110 active:scale-90 transition-all">❤️</button>
        </div>
      )}


      {/* Hero banner — thematic background */}
      <div className="relative pt-32 lg:pt-36 pb-20 overflow-hidden">
        {/* Background Layer */}
        <div className="absolute inset-0 bg-[#0B1310]" />
        {(sesion.dias_jornada?.imagen_url || IMAGENES_POR_DIA[sesion.dias_jornada?.nombre_dia]) ? (
          <img 
            src={sesion.dias_jornada?.imagen_url || IMAGENES_POR_DIA[sesion.dias_jornada?.nombre_dia]} 
            alt="" 
            className="absolute inset-0 w-full h-full object-cover opacity-50 transition-opacity duration-700"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1310] to-[#0F5B3C]" />
        )}
        
        {/* Glassmorphism/Readability Overlay: Más claro en el centro para ver la foto */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1310]/60 via-[#0B1310]/30 to-[#0B1310]" />
        <div className="absolute inset-0 bg-black/20" /> {/* Filtro extra de contraste */}

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-white/50 mb-6">
            <Link to="/" className="hover:text-white/80 transition-colors">Inicio</Link>
            <ChevronRight size={12} />
            <Link to="/agenda" className="hover:text-white/80 transition-colors">Agenda</Link>
            <ChevronRight size={12} />
            <span className="text-white/70 truncate max-w-xs">{sesion.nombre}</span>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${TIPO_COLORS[sesion.tipo] || 'bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300'}`}>
              {TIPO_LABELS[sesion.tipo] || sesion.tipo}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug max-w-2xl mb-6">
            {sesion.nombre}
          </h1>

          <div className="flex flex-wrap gap-4 text-sm text-white/70">
            {fechaFormateada && (
              <div className="flex items-center gap-2">
                <CalendarDays size={14} className="text-amber-400 shrink-0" />
                <span className="capitalize">{fechaFormateada}</span>
              </div>
            )}
            {sesion.hora_inicio && (
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-amber-400 shrink-0" />
                <span>{sesion.hora_inicio.slice(0, 5)} — {sesion.hora_fin?.slice(0, 5)} hrs</span>
              </div>
            )}
            {sesion.escenarios?.nombre && (
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-amber-400 shrink-0" />
                <span>{sesion.escenarios.nombre}</span>
              </div>
            )}
            {(sesion.programa_academico || []).length > 0 && (
              <div className="flex items-center gap-2">
                <Users size={14} className="text-amber-400 shrink-0" />
                <span>{sesion.programa_academico.map(p => PROGRAMA_LABELS[p] || p).join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT — Main content */}
          <div className="lg:col-span-2 space-y-5 order-2 lg:order-1">

            {/* Ponente card */}
            {sesion.ponente_nombre && (
              <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-sm border border-gray-100 dark:border-emerald-900/40 p-6">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Ponente</p>
                <div className="flex items-start gap-5">
                  {sesion.ponente_foto_url ? (
                    <img src={sesion.ponente_foto_url} alt={sesion.ponente_nombre}
                         className="w-16 h-16 rounded-full object-cover border-2 border-emerald-100 dark:border-emerald-900/50 shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0F5B3C] to-emerald-600 flex items-center justify-center shrink-0">
                      <span className="text-white text-2xl font-bold">
                        {sesion.ponente_nombre.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-tight">
                      {sesion.ponente_grado && (
                        <span className="text-[#0F5B3C] dark:text-emerald-400">{sesion.ponente_grado} </span>
                      )}
                      {sesion.ponente_nombre}
                    </p>
                    {sesion.ponente_institucion && (
                      <span className="inline-block mt-1.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs px-3 py-0.5 rounded-full font-semibold">
                        {sesion.ponente_institucion}
                      </span>
                    )}
                    {sesion.ponente_perfil_publico && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-3 leading-relaxed">
                        {sesion.ponente_perfil_publico}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}


            {/* Descripción */}
            {sesion.descripcion && (
              <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-sm border border-gray-100 dark:border-emerald-900/40 p-6">
                <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg border-l-4 border-[#0F5B3C] dark:border-emerald-600 pl-3 mb-4">
                  Acerca de esta sesión
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-justify">{sesion.descripcion}</p>
              </div>
            )}

            {/* Materiales */}
            {sesion.requiere_materiales && sesion.materiales_requeridos && (
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/40 p-6">
                <h2 className="font-bold text-amber-900 dark:text-amber-300 text-base mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  Materiales requeridos para participar
                </h2>
                <ul className="space-y-2">
                  {sesion.materiales_requeridos.split('\n').filter(m => m.trim()).map((mat, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-400">
                      <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-amber-500" />
                      <span>{mat.replace(/^-/, '').trim()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Detalles */}
            <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-sm border border-gray-100 dark:border-emerald-900/40 p-6">
              <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base mb-4 border-l-4 border-[#0F5B3C] dark:border-emerald-600 pl-3">
                Detalles de la sesión
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fechaFormateada && (
                  <div className="flex items-start gap-3">
                    <CalendarDays size={16} className="text-[#0F5B3C] dark:text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wide mb-0.5">Día</dt>
                      <dd className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">{fechaFormateada}</dd>
                    </div>
                  </div>
                )}
                {sesion.hora_inicio && (
                  <div className="flex items-start gap-3">
                    <Clock size={16} className="text-[#0F5B3C] dark:text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wide mb-0.5">Horario</dt>
                      <dd className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {sesion.hora_inicio.slice(0, 5)} — {sesion.hora_fin?.slice(0, 5)} hrs
                      </dd>
                    </div>
                  </div>
                )}
                {sesion.escenarios?.nombre && (
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-[#0F5B3C] dark:text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wide mb-0.5">Escenario</dt>
                      <dd className="text-sm font-semibold text-gray-800 dark:text-gray-200">{sesion.escenarios.nombre}</dd>
                    </div>
                  </div>
                )}
                {(sesion.programa_academico || []).length > 0 && (
                  <div className="flex items-start gap-3">
                    <Users size={16} className="text-[#0F5B3C] dark:text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wide mb-0.5">Dirigido a</dt>
                      <dd className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {sesion.programa_academico.map(p => PROGRAMA_LABELS[p] || p).join(', ')}
                      </dd>
                    </div>
                  </div>
                )}
              </dl>
            </div>

            {/* Q&A Section */}
            {yaInscrito && (
              <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-sm border border-gray-100 dark:border-emerald-900/40 p-6 mt-8">
                <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg border-l-4 border-[#0F5B3C] dark:border-emerald-600 pl-3 mb-4 flex items-center gap-2">
                  <MessageSquare size={20} /> Preguntas y Respuestas
                </h2>
                <div className="mb-6 flex gap-3">
                  <input
                    type="text"
                    value={nuevaPregunta}
                    onChange={(e) => setNuevaPregunta(e.target.value)}
                    placeholder="Pregunta algo al ponente..."
                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-[#0F2018] rounded-xl outline-none focus:border-[#0F5B3C] text-sm text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-emerald-900/50"
                  />
                  <button
                    onClick={handleEnviarPregunta}
                    disabled={enviandoPregunta || !nuevaPregunta.trim()}
                    className="px-4 py-3 bg-[#0F5B3C] text-white rounded-xl hover:bg-emerald-800 transition-colors disabled:opacity-50 shrink-0 flex items-center gap-2"
                  >
                    <Send size={16} /> <span className="hidden sm:inline">Enviar</span>
                  </button>
                </div>

                <div className="space-y-4 max-h-80 overflow-y-auto pr-2 scrollbar-hide">
                  {preguntas.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">Aún no hay preguntas. ¡Sé el primero!</p>
                  ) : (
                    preguntas.map(p => (
                      <div key={p.id} className={`p-4 rounded-xl border ${p.estado === 'respondida' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/50' : 'bg-gray-50 dark:bg-[#0F2018] border-gray-100 dark:border-emerald-900/30'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <span className="text-xs font-bold text-gray-900 dark:text-gray-100 block">{p.estudiantes?.nombre || 'Anónimo'}</span>
                            {p.estado === 'respondida' && <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Respondida ✓</span>}
                          </div>
                          <button 
                            onClick={() => toggleVote(p.id)}
                            disabled={p.estado === 'respondida'}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              preguntasVotadas.includes(p.id) 
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:hover:bg-amber-900/60' 
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-emerald-900/30 dark:hover:bg-emerald-800/40 dark:text-gray-300'
                            } ${p.estado === 'respondida' ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <ThumbsUp size={12} className={preguntasVotadas.includes(p.id) ? 'fill-current' : ''} /> {p.votos}
                          </button>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 text-justify mt-1">{p.pregunta}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Sidebar inscripción */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-md border border-gray-100 dark:border-emerald-900/40 p-6">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-5">Inscripción</h3>

              {/* Cupo */}
              {cupo > 0 && (
                <div className="mb-5">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Lugares</span>
                    <span className={`font-bold ${lleno ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                      {totalInscritos} / {cupo}
                    </span>
                  </div>
                  <div className="bg-gray-100 dark:bg-emerald-950/50 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`rounded-full h-2.5 transition-all ${
                        lleno ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-[#0F5B3C]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {lleno && (
                    <p className="text-xs text-red-600 dark:text-red-400 font-semibold mt-2 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                      Cupo lleno
                    </p>
                  )}
                  {!lleno && pct >= 70 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-2 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                      Pocos lugares disponibles
                    </p>
                  )}
                </div>
              )}

              {/* Ya inscrito o Finalizada */}
              {finalizada ? (
                <div className="space-y-3">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-center">
                    <p className="text-gray-600 dark:text-gray-400 font-bold text-sm">Esta sesión ha finalizado</p>
                    <p className="text-gray-500 dark:text-gray-500 text-xs mt-0.5">La jornada académica concluyó exitosamente.</p>
                  </div>
                  {yaAsistio && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-xl text-center">
                      <p className="text-emerald-700 dark:text-emerald-300 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                        <CheckCircle2 size={12} /> Asistencia Verificada
                      </p>
                    </div>
                  )}
                </div>
              ) : yaInscrito ? (
                <div className="space-y-3">
                  {inscripcionEstado === 'lista_espera' ? (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-850/50 rounded-xl text-center">
                      <p className="text-amber-700 dark:text-amber-300 font-bold text-sm">⏳ En lista de espera</p>
                      <p className="text-amber-600 dark:text-amber-400 text-xs mt-0.5">Te avisaremos si se libera un lugar</p>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-center">
                      <p className="text-emerald-700 dark:text-emerald-300 font-bold text-sm">✓ Estás inscrito(a)</p>
                      <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">Recibirás confirmación por correo</p>
                    </div>
                  )}
                  {yaAsistio && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl text-center">
                      <p className="text-blue-700 dark:text-blue-300 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                        <CheckCircle2 size={12} /> Asistencia Verificada
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleCancelar}
                    disabled={inscribiendo}
                    className="w-full py-2.5 text-red-500 dark:text-red-400 font-semibold border border-red-200 dark:border-red-900/40 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-all text-sm disabled:opacity-50"
                  >
                    {inscribiendo ? 'Cancelando...' : 'Cancelar registro'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleInscribirse}
                  disabled={inscribiendo}
                  className={`w-full py-3.5 text-white font-bold rounded-xl transition-all mb-3 disabled:opacity-50 text-sm ${
                    lleno ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#0F5B3C] hover:bg-emerald-800'
                  }`}
                >
                  {inscribiendo
                    ? 'Procesando...'
                    : lleno
                    ? 'Inscribirse en lista de espera ⏳'
                    : isLoggedIn
                    ? 'Inscribirse a esta sesión'
                    : 'Inicia sesión para inscribirte'}
                </button>
              )}

              {!isLoggedIn && !yaInscrito && !finalizada && (
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl text-center">
                  <p className="text-blue-700 dark:text-blue-300 text-xs font-medium">
                    <Link to="/login" className="underline font-bold">Inicia sesión</Link> o{' '}
                    <Link to="/registro" className="underline font-bold">regístrate</Link> para inscribirte
                  </p>
                </div>
              )}

              {/* Calendarios */}
              {!finalizada && sesion.dias_jornada?.fecha && sesion.hora_inicio && (
                <div className="space-y-2 mb-3">
                  <a
                    href={(() => {
                      const fecha = sesion.dias_jornada.fecha.replace(/-/g, '')
                      const hi    = (sesion.hora_inicio || '09:00:00').slice(0, 5).replace(':', '') + '00'
                      const hf    = (sesion.hora_fin    || '10:00:00').slice(0, 5).replace(':', '') + '00'
                      const p     = new URLSearchParams({
                        action: 'TEMPLATE', text: sesion.nombre,
                        dates:  `${fecha}T${hi}/${fecha}T${hf}`,
                        location: sesion.escenarios?.nombre || 'UES SJR',
                        details: sesion.descripcion || '',
                      })
                      return `https://calendar.google.com/calendar/render?${p}`
                    })()}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-[#0F5B3C] dark:border-emerald-700 text-[#0F5B3C] dark:text-emerald-400 font-semibold rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all text-sm"
                  >
                    <CalendarDays size={14} /> Añadir a Google Calendar
                  </a>
                  <button
                    onClick={handleDownloadICS}
                    className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-gray-200 dark:border-emerald-900/50 text-gray-600 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-emerald-900/20 transition-all text-sm"
                  >
                    <Download size={14} /> Descargar evento (.ics)
                  </button>
                </div>
              )}

              {/* Compartir */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  showToast('Enlace copiado al portapapeles')
                }}
                className="flex items-center justify-center gap-2 w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors py-2"
              >
                <Share2 size={14} /> Copiar enlace
              </button>
            </div>

            
            {/* Seccion de Encuestas Activas */}
            {yaInscrito && encuestas.filter(e => !encuestasOcultas.includes(e.id)).length > 0 && (
              <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900/40 p-6 mt-8">
                <h2 className="font-bold text-emerald-900 dark:text-emerald-400 text-lg border-l-4 border-emerald-500 pl-3 mb-4 flex items-center gap-2">
                  <BarChart size={20} /> Encuesta del Ponente
                </h2>
                <div className="space-y-6">
                  {encuestas.filter(e => !encuestasOcultas.includes(e.id)).map(e => (
                    <div key={e.id} className="bg-white dark:bg-[#122A1C] p-6 rounded-2xl shadow-sm relative group">
                      <button 
                        onClick={() => handleOcultarEncuesta(e.id)}
                        title="Ocultar encuesta"
                        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all bg-gray-50 dark:bg-emerald-950/30 p-1.5 rounded-lg"
                      >
                        <X size={16} />
                      </button>
                      <p className="font-black text-gray-900 dark:text-gray-100 text-lg mb-4 pr-8">{e.pregunta}</p>
                      {encuestasVotadas.includes(e.id) ? (
                        <div className="space-y-3">
                          {e.opciones.map((opt, i) => {
                            const totalVotos = e.opciones.reduce((acc, curr) => acc + curr.votos, 0)
                            const pct = totalVotos === 0 ? 0 : Math.round((opt.votos / totalVotos) * 100)
                            return (
                              <div key={i} className="relative bg-gray-50 dark:bg-black/20 rounded-xl p-3 overflow-hidden">
                                <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/30 transition-all duration-1000" style={{ width: `${pct}%` }} />
                                <div className="relative z-10 flex justify-between font-bold text-sm">
                                  <span className="text-gray-800 dark:text-gray-200">{opt.texto}</span>
                                  <span className="text-emerald-700 dark:text-emerald-400">{pct}%</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {e.opciones.map((opt, i) => (
                            <button 
                              key={i} 
                              onClick={() => handleVoteEncuesta(e.id, i)}
                              className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-emerald-50 dark:bg-[#0F2018] dark:hover:bg-emerald-900/30 rounded-xl font-bold text-sm text-gray-700 dark:text-gray-200 transition-colors border border-gray-100 dark:border-emerald-900/50"
                            >
                              {opt.texto}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seccion de Networking (Bolsa de Trabajo) */}
            {yaAsistio && !compartioNetworking && (
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl shadow-sm border border-blue-100 dark:border-blue-900/40 p-6 mt-8 anim-fade-up">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <h2 className="font-black text-blue-900 dark:text-blue-400 text-lg mb-1">Networking Exclusivo</h2>
                    <p className="text-sm text-blue-800 dark:text-blue-300/80 mb-4 text-justify">El ponente ha habilitado una bolsa de trabajo. Comparte tu perfil profesional de la universidad para ser contactado por oportunidades.</p>
                    <button onClick={handleCompartirPerfil} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-blue-900/20 active:scale-95">
                      Compartir mi Perfil
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN DE FEEDBACK (EN SIDEBAR) */}

            {yaAsistio && (
              <div className="mt-6 bg-white dark:bg-[#122A1C] rounded-2xl p-8 shadow-md border border-gray-100 dark:border-emerald-900/40 text-center anim-fade-up">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star size={32} className={yaValoro ? 'text-amber-400 fill-amber-400' : 'text-emerald-500'} />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base mb-2">
                  {yaValoro ? 'Sesión Calificada' : '¿Qué te pareció?'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 font-medium leading-relaxed">
                  {yaValoro 
                    ? 'Gracias por ayudarnos a mejorar con tu opinión.' 
                    : 'Tu feedback es muy valioso para el ponente y la universidad.'}
                </p>
                <button 
                  onClick={() => setShowRatingModal(true)}
                  className="w-full py-4 bg-[#0F5B3C] text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/20"
                >
                  {yaValoro ? 'Ver mi calificación' : 'Calificar sesión'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Calificación */}
      {showRatingModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm anim-fade-in">
          <div className="bg-white dark:bg-[#122A1C] rounded-[2.5rem] p-8 sm:p-12 shadow-2xl border border-gray-100 dark:border-emerald-900/30 w-full max-w-xl relative anim-fade-up">
            <button 
              onClick={() => setShowRatingModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors outline-none"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Califica esta sesión</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">Tu opinión ayuda a mejorar futuras jornadas académicas.</p>

            {yaValoro ? (
              <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 rounded-3xl border border-emerald-100 dark:border-emerald-900/30 text-center sm:text-left">
                <div className="flex items-center gap-1 mb-3 justify-center sm:justify-start">
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} size={20} className={n <= valoracion.estrellas ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-emerald-900/50'} />
                  ))}
                </div>
                <p className="text-[#0F5B3C] dark:text-emerald-400 font-bold">¡Valoración enviada!</p>
                <p className="text-emerald-600 dark:text-emerald-500 text-sm italic mt-2">
                  {valoracion.comentario ? `"${valoracion.comentario}"` : 'Sin comentarios adicionales.'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Estrellas */}
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  {[1,2,3,4,5].map(n => (
                    <button 
                      key={n} 
                      onClick={() => setValoracion(p => ({ ...p, estrellas: n }))}
                      className="transition-transform hover:scale-125 focus:scale-110 outline-none"
                    >
                      <Star size={32} className={n <= valoracion.estrellas ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-emerald-900/50'} />
                    </button>
                  ))}
                </div>
                <div className="text-center sm:text-left">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    {['Pobre','Regular','Buena','Muy buena','Excelente'][valoracion.estrellas - 1] || 'Toca para calificar'}
                  </span>
                </div>

                {/* Comentario */}
                <div>
                  <textarea 
                    value={valoracion.comentario}
                    onChange={e => setValoracion(p => ({ ...p, comentario: e.target.value }))}
                    placeholder="Escribe un comentario opcional sobre la sesión, el ponente o el contenido..."
                    className="w-full p-5 bg-gray-50 dark:bg-[#0F2018] border border-gray-100 dark:border-emerald-900/50 rounded-[2rem] outline-none focus:border-[#0F5B3C] text-sm font-medium dark:text-gray-200 resize-none h-32"
                  />
                </div>

                <button 
                  onClick={async () => {
                    await handleValorar();
                  }}
                  disabled={enviandoVal || valoracion.estrellas === 0}
                  className="px-10 py-4 w-full bg-[#0F5B3C] text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                >
                  {enviandoVal ? 'Enviando...' : 'Enviar Calificación'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 px-6 py-3.5 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 anim-fade-up ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#0F5B3C] text-white'
        }`}>
          {toast.type === 'error' ? '⚠️' : '✓'} {toast.msg}
        </div>
      )}
    </div>
  )
}

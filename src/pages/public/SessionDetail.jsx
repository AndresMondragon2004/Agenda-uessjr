import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Clock, MapPin, CalendarDays, Users, Share2, ChevronRight, CheckCircle2, Download, Star, X } from 'lucide-react'
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
            .select('*')
            .eq('sesion_id', id)
            .eq('estudiante_id', estudiante.id)
            .maybeSingle()
          if (val) {
            setYaValoro(true)
            setValoracion({ estrellas: val.estrellas, comentario: val.comentario })
          }
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [id, estudiante])

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0A1A11]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#1B4332]/20 dark:border-emerald-900/50 border-t-[#1B4332] dark:border-t-emerald-500 animate-spin" />
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Cargando sesión...</p>
      </div>
    </div>
  )

  if (error || !sesion) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0A1A11] px-4">
      <div className="text-center py-16 max-w-sm">
        <div className="w-20 h-20 bg-gray-100 dark:bg-[#122A1C] rounded-full flex items-center justify-center mx-auto mb-4">
          <CalendarDays className="w-10 h-10 text-gray-300 dark:text-emerald-900" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Sesión no encontrada</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Esta sesión no existe o fue eliminada.</p>
        <Link to="/agenda" className="px-6 py-2.5 bg-[#1B4332] text-white font-semibold rounded-xl hover:bg-emerald-800 transition-colors">
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
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A1A11] pb-12">

      {/* Hero banner — thematic background */}
      <div className="relative pt-32 lg:pt-36 pb-20 overflow-hidden">
        {/* Background Layer */}
        <div className="absolute inset-0 bg-[#0A1A11]" />
        {(sesion.dias_jornada?.imagen_url || IMAGENES_POR_DIA[sesion.dias_jornada?.nombre_dia]) ? (
          <img 
            src={sesion.dias_jornada?.imagen_url || IMAGENES_POR_DIA[sesion.dias_jornada?.nombre_dia]} 
            alt="" 
            className="absolute inset-0 w-full h-full object-cover opacity-50 transition-opacity duration-700"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D2B1D] to-[#1B4332]" />
        )}
        
        {/* Glassmorphism/Readability Overlay: Más claro en el centro para ver la foto */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1A11]/60 via-[#0A1A11]/30 to-[#0A1A11]" />
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
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1B4332] to-emerald-600 flex items-center justify-center shrink-0">
                      <span className="text-white text-2xl font-bold">
                        {sesion.ponente_nombre.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-tight">
                      {sesion.ponente_grado && (
                        <span className="text-[#1B4332] dark:text-emerald-400">{sesion.ponente_grado} </span>
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
                <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg border-l-4 border-[#1B4332] dark:border-emerald-600 pl-3 mb-4">
                  Acerca de esta sesión
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{sesion.descripcion}</p>
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
              <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base mb-4 border-l-4 border-[#1B4332] dark:border-emerald-600 pl-3">
                Detalles de la sesión
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fechaFormateada && (
                  <div className="flex items-start gap-3">
                    <CalendarDays size={16} className="text-[#1B4332] dark:text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wide mb-0.5">Día</dt>
                      <dd className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">{fechaFormateada}</dd>
                    </div>
                  </div>
                )}
                {sesion.hora_inicio && (
                  <div className="flex items-start gap-3">
                    <Clock size={16} className="text-[#1B4332] dark:text-emerald-500 shrink-0 mt-0.5" />
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
                    <MapPin size={16} className="text-[#1B4332] dark:text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wide mb-0.5">Escenario</dt>
                      <dd className="text-sm font-semibold text-gray-800 dark:text-gray-200">{sesion.escenarios.nombre}</dd>
                    </div>
                  </div>
                )}
                {(sesion.programa_academico || []).length > 0 && (
                  <div className="flex items-start gap-3">
                    <Users size={16} className="text-[#1B4332] dark:text-emerald-500 shrink-0 mt-0.5" />
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
                        lleno ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-[#1B4332]'
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
                <div className="p-4 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-center">
                  <p className="text-gray-600 dark:text-gray-400 font-bold text-sm">Esta sesión ha finalizado</p>
                  <p className="text-gray-500 dark:text-gray-500 text-xs mt-0.5">La jornada académica concluyó exitosamente.</p>
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
                    lleno ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#1B4332] hover:bg-emerald-800'
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
              {sesion.dias_jornada?.fecha && sesion.hora_inicio && (
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
                    className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-[#1B4332] dark:border-emerald-700 text-[#1B4332] dark:text-emerald-400 font-semibold rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all text-sm"
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
                  className="w-full py-4 bg-[#1B4332] text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/20"
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
                <p className="text-[#1B4332] dark:text-emerald-400 font-bold">¡Valoración enviada!</p>
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
                    className="w-full p-5 bg-gray-50 dark:bg-[#0F2018] border border-gray-100 dark:border-emerald-900/50 rounded-[2rem] outline-none focus:border-[#1B4332] text-sm font-medium dark:text-gray-200 resize-none h-32"
                  />
                </div>

                <button 
                  onClick={async () => {
                    await handleValorar();
                  }}
                  disabled={enviandoVal || valoracion.estrellas === 0}
                  className="px-10 py-4 w-full bg-[#1B4332] text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                >
                  {enviandoVal ? 'Enviando...' : 'Enviar Calificación'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-3.5 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 anim-fade-up ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#1B4332] text-white'
        }`}>
          {toast.type === 'error' ? '⚠️' : '✓'} {toast.msg}
        </div>
      )}
    </div>
  )
}

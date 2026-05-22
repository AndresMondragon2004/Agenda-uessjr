import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Clock, MapPin, Search, Download, ChevronRight, Loader2, Share2, Check } from 'lucide-react'
import { jornadaService }  from '../../services/jornada.service'
import { sesionesService } from '../../services/sesiones.service'
import { generateAgendaPDF } from '../../utils/pdfGenerator'
import { parseSafeDate } from '../../utils/dateHelper'

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

const PROGRAMA_COLORS = {
  sistemas:            { bg: 'bg-amber-100 dark:bg-amber-900/40',   text: 'text-amber-800 dark:text-amber-300',   active: 'bg-amber-600'  },
  innovacion_agricola: { bg: 'bg-green-100 dark:bg-green-900/40',   text: 'text-green-800 dark:text-green-300',   active: 'bg-green-700'  },
  contaduria:          { bg: 'bg-blue-100 dark:bg-blue-900/40',     text: 'text-blue-800 dark:text-blue-300',     active: 'bg-blue-700'   },
  publico_general:     { bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-800 dark:text-violet-300', active: 'bg-violet-700' },
}

const IMAGENES_POR_DIA = {
  'Lunes':     '/images/imagenes_reporte/ajolote_lunes.jpg',
  'Martes':    '/images/imagenes_reporte/software_martes.jpg',
  'Miércoles': '/images/imagenes_reporte/manualidades_miercoles.jpg',
  'Jueves':    '/images/imagenes_reporte/computacion_jueves.jpg',
  'Viernes':   '/images/imagenes_reporte/robots_viernes.jpg',
}

export default function Agenda() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [jornada,    setJornada]    = useState(null)
  const [sesiones,   setSesiones]   = useState([])
  const [dias,       setDias]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [diaFiltro,  setDiaFiltro]  = useState('todos')
  const [tipoFiltro, setTipoFiltro] = useState('todos')
  const [progFiltro, setProgFiltro] = useState(() => searchParams.get('programa') || 'todos')
  const [busqueda,   setBusqueda]   = useState('')
  const [generating, setGenerating] = useState(false)
  const [copiedLink, setCopiedLink] = useState(null)

  const handleShare = (sesionId) => {
    const url = `${window.location.origin}/agenda/${sesionId}`
    navigator.clipboard.writeText(url)
    setCopiedLink(sesionId)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  useEffect(() => {
    const prog = searchParams.get('programa')
    if (prog) setProgFiltro(prog)
  }, [searchParams])

  useEffect(() => {
    async function cargar() {
      try {
        const j = await jornadaService.getActiva()
        setJornada(j)
        const diasOrdenados = (j.dias_jornada || [])
          .sort((a, b) => parseSafeDate(a.fecha) - parseSafeDate(b.fecha))
        setDias(diasOrdenados)
        const data = await sesionesService.getByJornada(j.id)
        setSesiones(data?.filter(s => s.estado === 'activa') || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  const handleDownloadPDF = async () => {
    try {
      setGenerating(true)
      await generateAgendaPDF(jornada, sesiones, {
        incluyePonentes: true,
        diasSeleccionados: diaFiltro
      })
    } catch (err) {
      console.error('Error al generar PDF:', err)
      alert('Hubo un error al generar el PDF. Por favor, intente de nuevo.')
    } finally {
      setGenerating(false)
    }
  }

  function updateProgFiltro(val) {
    setProgFiltro(val)
    if (val === 'todos') {
      searchParams.delete('programa')
    } else {
      searchParams.set('programa', val)
    }
    setSearchParams(searchParams, { replace: true })
  }

  const sesionesFiltradas = sesiones
    .filter(s => diaFiltro === 'todos' || s.dia_jornada_id === diaFiltro)
    .filter(s => tipoFiltro === 'todos' || s.tipo === tipoFiltro)
    .filter(s => {
      if (progFiltro === 'todos') return true
      return (s.programa_academico || []).includes(progFiltro)
    })
    .filter(s => {
      if (!busqueda) return true
      const q = busqueda.toLowerCase()
      return s.nombre?.toLowerCase().includes(q) ||
        s.ponente_nombre?.toLowerCase().includes(q)
    })

  const totalFiltradas = sesionesFiltradas.length

  const sesionesAgrupadas = dias.map(dia => ({
    dia,
    sesiones: sesionesFiltradas
      .filter(s => s.dia_jornada_id === dia.id)
      .sort((a, b) => a.hora_inicio?.localeCompare(b.hora_inicio)),
  })).filter(g =>
    diaFiltro === 'todos' ? g.sesiones.length > 0 : g.dia.id === diaFiltro
  )

  function formatDiaHeader(dia) {
    const d = parseSafeDate(dia.fecha, '12:00:00')
    if (!d) return ''
    return d.toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  function formatShortDay(dia) {
    const d = parseSafeDate(dia.fecha, '12:00:00')
    if (!d) return ''
    const nombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    return `${nombres[d.getDay()]} ${d.getDate()}`
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [diaFiltro, tipoFiltro, progFiltro, busqueda])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A1A11]">

      {/* PAGE HEADER */}
      <div className="bg-white dark:bg-[#122A1C] border-b border-gray-100 dark:border-emerald-900/40 pt-16">
        <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-1 flex items-center gap-1">
                <Link to="/" className="hover:text-[#1B4332] dark:text-gray-500 dark:hover:text-emerald-400 transition-colors">Inicio</Link>
                <span>/</span>
                <span className="text-gray-600 dark:text-gray-400">Agenda</span>
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1B4332] dark:text-emerald-400 tracking-tight">
                Agenda de la jornada
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xl">
                Explora todas las sesiones, filtra por día, carrera o tipo de actividad.
              </p>
              {!loading && (
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{totalFiltradas}</span> sesiones
                  {progFiltro !== 'todos' && (
                    <span> · Filtrando por <span className="font-semibold text-[#1B4332] dark:text-emerald-400">{PROGRAMA_LABELS[progFiltro]}</span></span>
                  )}
                </p>
              )}
            </div>
            <button 
              onClick={handleDownloadPDF}
              disabled={generating || loading || sesiones.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 border-2 border-[#1B4332] dark:border-emerald-700 text-[#1B4332] dark:text-emerald-400 font-semibold rounded-xl hover:bg-[#1B4332] dark:hover:bg-emerald-800 hover:text-white transition-all text-sm min-h-[44px] shrink-0 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span className="hidden sm:inline">Generando...</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span className="hidden sm:inline">Descargar programa PDF</span>
                  <span className="sm:hidden">PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* FILTER BAR */}
        <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-sm border border-gray-100 dark:border-emerald-900/40 p-4 mb-8">
          <div className="flex flex-col gap-5">

            {/* Filtro por programa académico */}
            <div>
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2.5">Filtrar por carrera</p>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => updateProgFiltro('todos')}
                  className={`px-4 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all shrink-0 ${
                    progFiltro === 'todos'
                      ? 'bg-[#1B4332] text-white shadow-md'
                      : 'bg-gray-100 dark:bg-emerald-950/30 text-gray-500 dark:text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  Ver todo
                </button>
                {Object.entries(PROGRAMA_LABELS).map(([val, label]) => {
                  const colors = PROGRAMA_COLORS[val]
                  const isActive = progFiltro === val
                  return (
                    <button
                      key={val}
                      onClick={() => updateProgFiltro(val)}
                      className={`px-4 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all shrink-0 ${
                        isActive
                          ? `${colors.active} text-white shadow-md`
                          : `${colors.bg} ${colors.text} hover:opacity-80`
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {/* Filtro por día */}
              <div className="md:col-span-4">
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2.5">Día de la jornada</p>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  <button
                    onClick={() => setDiaFiltro('todos')}
                    className={`px-4 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border-2 ${
                      diaFiltro === 'todos'
                        ? 'bg-[#1B4332] text-white border-[#1B4332] shadow-md'
                        : 'bg-white dark:bg-[#0F2018] text-gray-500 dark:text-gray-400 border-gray-100 dark:border-emerald-900/30 hover:border-[#1B4332] dark:hover:border-emerald-700'
                    }`}
                  >
                    Todos
                  </button>
                  {dias.map(dia => (
                    <button key={dia.id}
                      onClick={() => setDiaFiltro(dia.id)}
                      className={`px-4 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border-2 ${
                        diaFiltro === dia.id
                          ? 'bg-[#1B4332] text-white border-[#1B4332] shadow-md'
                          : 'bg-white dark:bg-[#0F2018] text-gray-500 dark:text-gray-400 border-gray-100 dark:border-emerald-900/30 hover:border-[#1B4332] dark:hover:border-emerald-700'
                      }`}
                    >
                      {formatShortDay(dia)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipo */}
              <div className="md:col-span-3">
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2">Actividad</p>
                <select
                  value={tipoFiltro}
                  onChange={e => setTipoFiltro(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-100 dark:border-emerald-900/50 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 focus:border-[#1B4332] outline-none bg-gray-50/50 dark:bg-emerald-950/20"
                >
                  <option value="todos">Todos los tipos</option>
                  {Object.entries(TIPO_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Búsqueda */}
              <div className="md:col-span-5 relative">
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2">Búsqueda rápida</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    placeholder="Título, ponente o institución..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-100 dark:border-emerald-900/50 rounded-xl text-xs font-bold focus:border-[#1B4332] outline-none bg-gray-50/50 dark:bg-emerald-950/20 dark:text-gray-300"
                  />
                  {(diaFiltro !== 'todos' || tipoFiltro !== 'todos' || progFiltro !== 'todos' || busqueda) && (
                    <button
                      onClick={() => { setDiaFiltro('todos'); setTipoFiltro('todos'); updateProgFiltro('todos'); setBusqueda('') }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[9px] font-black uppercase text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SESSIONS LIST */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white dark:bg-[#122A1C] rounded-2xl h-28 shimmer-bg border border-gray-100 dark:border-emerald-900/40" />
            ))}
          </div>
        ) : sesionesAgrupadas.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-[#122A1C] rounded-2xl border border-gray-100 dark:border-emerald-900/40">
            <div className="w-16 h-16 bg-gray-100 dark:bg-[#1A3425] rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-300 dark:text-emerald-900" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No se encontraron sesiones</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {sesiones.length === 0
                ? 'Las sesiones se publicarán próximamente.'
                : 'Intenta cambiar los filtros de búsqueda.'}
            </p>
            {sesiones.length > 0 && (
              <button
                onClick={() => { setDiaFiltro('todos'); setTipoFiltro('todos'); updateProgFiltro('todos'); setBusqueda('') }}
                className="mt-4 px-5 py-2 bg-[#1B4332] text-white font-semibold rounded-xl text-sm hover:bg-emerald-800 transition-colors"
              >
                Ver todas las sesiones
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {sesionesAgrupadas.map(({ dia, sesiones: sesDia }) => (
              <div key={dia.id}>

                {/* Day header */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="h-px flex-1 bg-gray-200 dark:bg-emerald-900/40" />
                  <div className="flex items-center gap-2 bg-[#1B4332] text-white px-4 py-1.5 rounded-full">
                    <span className="text-xs font-bold capitalize">{formatDiaHeader(dia)}</span>
                  </div>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-emerald-900/40" />
                </div>

                {/* Sessions of this day */}
                <div className="space-y-3">
                  {sesDia.map(ses => (
                    <div key={ses.id}
                         className="group bg-white dark:bg-[#122A1C] rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-emerald-900/40 border-l-4 p-5 sm:p-6"
                         style={{ borderLeftColor: '#1B4332' }}>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-6">

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
                            <Clock size={13} />
                            {ses.hora_inicio?.slice(0, 5)}
                            {ses.hora_fin && ` — ${ses.hora_fin.slice(0, 5)}`}
                          </div>

                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${TIPO_COLORS[ses.tipo] || 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300'}`}>
                              {TIPO_LABELS[ses.tipo] || ses.tipo}
                            </span>
                            {ses.escenarios?.nombre && (
                              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                <MapPin size={10} />
                                {ses.escenarios.nombre}
                              </span>
                            )}
                            {(ses.programa_academico || []).length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {(ses.programa_academico || []).map(prog => {
                                  const c = PROGRAMA_COLORS[prog]
                                  return c ? (
                                    <span key={prog} className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
                                      {PROGRAMA_LABELS[prog]}
                                    </span>
                                  ) : null
                                })}
                              </div>
                            )}
                          </div>

                          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base leading-snug mb-2 group-hover:text-[#1B4332] dark:group-hover:text-emerald-400 transition-colors">
                            {ses.nombre}
                          </h3>

                          {ses.ponente_nombre && (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#1B4332]/10 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                                <span className="text-[#1B4332] dark:text-emerald-400 text-[10px] font-bold">
                                  {ses.ponente_nombre.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{ses.ponente_grado}</span>{' '}
                                {ses.ponente_nombre}
                                {ses.ponente_institucion && (
                                  <span className="text-gray-400 dark:text-gray-500"> · {ses.ponente_institucion}</span>
                                )}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="shrink-0 flex flex-col gap-2 sm:min-w-[140px]">
                          <div className="flex gap-2">
                            <Link
                              to={`/agenda/${ses.id}`}
                              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#1B4332] text-white text-xs font-bold rounded-xl hover:bg-emerald-800 transition-colors min-h-[42px] shadow-sm"
                            >
                              Detalles <ChevronRight size={13} />
                            </Link>
                            <button
                              onClick={(e) => { e.preventDefault(); handleShare(ses.id) }}
                              className="px-3 py-2.5 bg-gray-100 dark:bg-emerald-900/30 text-gray-500 dark:text-gray-400 hover:text-[#1B4332] dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 rounded-xl transition-all min-h-[42px]"
                              title="Copiar enlace"
                            >
                              {copiedLink === ses.id ? <Check size={16} className="text-emerald-500" /> : <Share2 size={16} />}
                            </button>
                          </div>
                          
                          {ses.escenarios?.capacidad_maxima && (() => {
                            const cupo = ses.escenarios.capacidad_maxima
                            const inscritos = ses.total_inscritos || 0
                            const disponibles = Math.max(0, cupo - inscritos)
                            const porcentaje = cupo > 0 ? Math.min((inscritos / cupo) * 100, 100) : 0
                            
                            let colorClass = 'bg-emerald-500'
                            if (porcentaje > 80) colorClass = 'bg-amber-500'
                            if (porcentaje >= 100) colorClass = 'bg-red-500'

                            return (
                              <div className="flex flex-col mt-1">
                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
                                  <span className={disponibles === 0 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}>
                                    {disponibles === 0 ? 'Agotado' : `${disponibles} libres`}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-emerald-900/30 h-1.5 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${colorClass} transition-all duration-500`} style={{ width: `${porcentaje}%` }} />
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

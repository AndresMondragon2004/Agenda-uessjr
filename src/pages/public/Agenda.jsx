import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  MapPin, Search, Download, 
  Loader2, Share2, Check, Filter, X,
  Calendar, ArrowRight
} from 'lucide-react'
import { jornadaService }  from '../../services/jornada.service'
import { sesionesService } from '../../services/sesiones.service'
import { generateAgendaPDF } from '../../utils/pdfGenerator'
import { parseSafeDate } from '../../utils/dateHelper'
import SEO from '../../components/SEO'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05
    }
  }
}

const TIPO_COLORS = {
  inauguracion: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
  conferencia:  'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
  taller:       'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
  cultural:     'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
  protocolo:    'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/20',
  competencia:  'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
  cierre:       'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20',
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
  sistemas:            'Ingeniería en Sistemas',
  innovacion_agricola: 'Innovación Agrícola',
  contaduria:          'Contaduría',
  publico_general:     'Cultura y Comunidad',
}

export default function Agenda() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [jornada,    setJornada]    = useState(null)
  const [sesiones,   setSesiones]   = useState([])
  const [dias,       setDias]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [diaFiltro,  setDiaFiltro]  = useState('todos')
  const [tipoFiltro, setTipoFiltro] = useState('todos')
  const progFiltro = searchParams.get('programa') || 'todos'
  const [busqueda,   setBusqueda]   = useState('')
  const [generating, setGenerating] = useState(false)
  const [copiedLink, setCopiedLink] = useState(null)

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
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  function updateProgFiltro(val) {
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
      return s.nombre.toLowerCase().includes(q) || (s.ponente_nombre && s.ponente_nombre.toLowerCase().includes(q))
    })

  const sesionesAgrupadas = dias.map(dia => ({
    dia,
    sesiones: sesionesFiltradas
      .filter(s => s.dia_jornada_id === dia.id)
      .sort((a, b) => a.hora_inicio?.localeCompare(b.hora_inicio)),
  })).filter(g =>
    diaFiltro === 'todos' ? g.sesiones.length > 0 : g.dia.id === diaFiltro
  )

  const handleShare = (sesionId) => {
    const url = `${window.location.origin}/agenda/${sesionId}`
    navigator.clipboard.writeText(url)
    setCopiedLink(sesionId)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  const handleDayClick = (id) => {
    setDiaFiltro(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <SEO title="Agenda" />
      <div className="bg-[#FCFCFC] dark:bg-surface-dark-bg min-h-screen">
        
        {/* Editorial Header - More Compact */}
        <header className="pt-32 pb-12 px-6 lg:px-12 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-surface-dark-bg">
          <div className="max-w-[1600px] mx-auto">
            <motion.div initial="initial" animate="animate" variants={staggerContainer} className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
              <div className="max-w-4xl overflow-hidden">
                <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-ues-green flex items-center justify-center text-ues-gold shadow-lg shadow-ues-green/20">
                    <Calendar size={16} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Cronograma Académico</span>
                </motion.div>
                
                <motion.h1 variants={fadeInUp} className="text-4xl sm:text-6xl lg:text-7xl font-serif font-black text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-8 whitespace-nowrap">
                  El <span className="italic text-ues-green dark:text-apple">Calendario</span> de la Excelencia.
                </motion.h1>
                
                <motion.p variants={fadeInUp} className="text-gray-600 dark:text-gray-400 text-xl font-medium max-w-xl leading-relaxed">
                  Explora las sesiones, talleres y eventos culturales. Planifica tu semana de formación integral en la UESSJR.
                </motion.p>
              </div>

              <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-6 shrink-0">
                <button 
                  onClick={handleDownloadPDF}
                  disabled={generating || loading}
                  className="flex items-center gap-3 bg-ues-green text-white px-10 py-5 rounded-full font-black uppercase text-xs tracking-widest hover:bg-emerald-900 transition-all shadow-xl shadow-ues-green/30 disabled:opacity-50"
                >
                  {generating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} className="text-apple" />}
                  Descargar Programa PDF
                </button>
              </motion.div>
            </motion.div>
          </div>
        </header>

        {/* Filters Section - High Contrast */}
        <section className="sticky top-[89px] z-40 px-6 lg:px-12 py-6 bg-white/90 dark:bg-surface-dark-bg/90 backdrop-blur-xl border-b border-gray-100 dark:border-white/5">
          <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
            
            {/* Horizontal Days */}
            <div className="flex items-center gap-3 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-hide">
              <button
                onClick={() => handleDayClick('todos')}
                className={`px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border-2 ${
                  diaFiltro === 'todos' 
                    ? 'bg-gray-900 dark:bg-ues-gold text-white dark:text-ues-green border-transparent shadow-xl' 
                    : 'text-gray-900 dark:text-gray-100 border-gray-100 dark:border-white/10 hover:border-ues-gold/30'
                }`}
              >
                Todos los Días
              </button>
              {dias.map(dia => {
                const date = parseSafeDate(dia.fecha, '12:00:00')
                const shortName = date.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', '')
                const dayNum = date.getDate()
                return (
                  <button
                    key={dia.id}
                    onClick={() => handleDayClick(dia.id)}
                    className={`flex items-center gap-3 px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border-2 ${
                      diaFiltro === dia.id 
                        ? 'bg-ues-green text-white border-transparent shadow-xl shadow-ues-green/20' 
                        : 'text-gray-900 dark:text-gray-100 border-gray-100 dark:border-white/10 hover:border-ues-gold/30'
                    }`}
                  >
                    <span className="opacity-50 font-serif italic text-sm">{shortName}</span>
                    <span className="text-sm">{dayNum}</span>
                  </button>
                )
              })}
            </div>

            {/* Search and Advanced Filters */}
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-96 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-ues-green transition-colors" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar sesiones o ponentes..."
                  className="w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-full text-sm font-bold text-gray-900 dark:text-white focus:ring-4 ring-ues-green/5 outline-none transition-all placeholder:text-gray-300"
                />
              </div>
              <div className="relative">
                <select
                  value={progFiltro}
                  onChange={e => updateProgFiltro(e.target.value)}
                  className="appearance-none bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 px-12 py-4 rounded-full text-xs font-black uppercase tracking-widest text-gray-900 dark:text-gray-100 outline-none focus:ring-4 ring-ues-green/5 cursor-pointer min-w-[200px] shadow-sm"
                >
                  <option value="todos">Todas las Áreas</option>
                  {Object.entries(PROGRAMA_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Area */}
        <main className="px-6 lg:px-12 py-16">
          <div className="max-w-[1600px] mx-auto">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="aspect-video bg-gray-100 dark:bg-white/5 rounded-[3.5rem] animate-pulse" />
                ))}
              </div>
            ) : sesionesAgrupadas.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-40 text-center">
                <div className="w-24 h-24 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-8 border-2 border-gray-100">
                  <Search size={40} className="text-gray-200" />
                </div>
                <h2 className="text-4xl font-serif font-black text-gray-900 dark:text-white mb-4 tracking-tighter">Sin resultados</h2>
                <p className="text-gray-400 font-medium text-lg max-w-sm">No encontramos eventos que coincidan con tu búsqueda actual.</p>
                <button 
                  onClick={() => { handleDayClick('todos'); updateProgFiltro('todos'); setBusqueda(''); setTipoFiltro('todos') }}
                  className="mt-12 text-ues-green dark:text-ues-gold font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-3 border-2 border-gray-100 dark:border-white/10 px-8 py-4 rounded-full hover:bg-gray-50 transition-all"
                >
                  Reiniciar Cronograma <X size={14} />
                </button>
              </motion.div>
            ) : (
              <div className="space-y-24">
                {sesionesAgrupadas.map(({ dia, sesiones: sesDia }) => (
                  <div key={dia.id} className="relative">
                    {/* Day Header - More Compact */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b-2 border-ues-green pb-6">
                      <div className="flex items-center gap-6">
                        <span className="text-5xl sm:text-6xl font-serif font-black text-ues-green dark:text-ues-gold italic tabular-nums opacity-20">
                          {parseSafeDate(dia.fecha, '12:00:00').getDate()}
                        </span>
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-ues-green/50 dark:text-ues-gold/50 mb-1 block">
                            {parseSafeDate(dia.fecha, '12:00:00').toLocaleDateString('es-MX', { weekday: 'long' }).toUpperCase()}
                          </span>
                          <h2 className="text-3xl sm:text-4xl font-serif font-black text-gray-900 dark:text-white tracking-tighter">
                            {parseSafeDate(dia.fecha, '12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
                          </h2>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-ues-green/5 dark:bg-white/5 px-6 py-3 rounded-2xl border border-ues-gold/10">
                        <span className="font-serif font-black italic text-3xl text-gray-900 dark:text-white tabular-nums leading-none">{sesDia.length}</span>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-ues-green dark:text-ues-gold">Sesiones</span>
                      </div>
                    </div>

                    <motion.div 
                      variants={staggerContainer} initial="initial" whileInView="animate" viewport={{ once: true }}
                      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                    >
                      {sesDia.map(ses => (
                        <motion.div
                          key={ses.id}
                          variants={fadeInUp}
                          className="group bg-white dark:bg-surface-dark-card p-6 rounded-[2rem] border-2 border-ues-gold/10 shadow-bento dark:shadow-bento-dark flex flex-col hover:-translate-y-1 hover:border-ues-gold/40 transition-all duration-300 relative overflow-hidden"
                        >
                          <div className="flex items-start justify-between mb-6">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${TIPO_COLORS[ses.tipo] || TIPO_COLORS.protocolo} border border-black/5 dark:border-white/5`}>
                              {TIPO_LABELS[ses.tipo] || ses.tipo}
                            </span>
                            <button 
                              onClick={() => handleShare(ses.id)}
                              className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-ues-green transition-colors border border-gray-100"
                            >
                              {copiedLink === ses.id ? <Check size={14} /> : <Share2 size={14} />}
                            </button>
                          </div>

                          <div className="flex items-center gap-2 mb-4 text-gray-900 dark:text-white font-serif font-black text-xl tabular-nums italic">
                            {ses.hora_inicio?.slice(0, 5)}
                            <span className="text-ues-gold/40 mx-1">/</span>
                            <span className="text-gray-400">{ses.hora_fin?.slice(0, 5)}</span>
                          </div>

                          <h3 className="text-xl font-serif font-black text-gray-900 dark:text-white mb-6 leading-tight group-hover:text-ues-green dark:group-hover:text-ues-gold transition-colors line-clamp-2 min-h-[3rem]">
                            {ses.nombre}
                          </h3>

                          {ses.ponente_nombre && (
                            <div className="flex items-center gap-3 mb-6 p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-transparent group-hover:border-ues-gold/10 transition-all">
                              <div className="w-10 h-10 rounded-xl bg-ues-green flex items-center justify-center shrink-0 shadow-lg text-apple text-lg font-serif font-black">
                                {ses.ponente_nombre.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-gray-900 dark:text-white text-[12px] font-black truncate uppercase tracking-tight">
                                  {ses.ponente_grado} {ses.ponente_nombre}
                                </p>
                                <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest truncate mt-0.5">{ses.ponente_institucion}</p>
                              </div>
                            </div>
                          )}

                          <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-2 text-gray-400 text-[9px] font-black uppercase tracking-widest">
                              <MapPin size={11} className="text-apple" />
                              <span className="truncate max-w-[120px]">{ses.escenarios?.nombre || 'Campus'}</span>
                            </div>
                            <Link to={`/agenda/${ses.id}`} className="group/btn flex items-center gap-2 bg-ues-green text-white px-6 py-2.5 rounded-full font-black uppercase text-[9px] tracking-widest hover:bg-emerald-900 transition-all shadow-xl">
                              Detalles <ArrowRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}

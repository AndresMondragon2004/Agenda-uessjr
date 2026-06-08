import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Mic2, ChevronRight, ChevronLeft, X, 
  Globe, Share2, ExternalLink
} from 'lucide-react'
import { sesionesService } from '../../services/sesiones.service'
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

const PROGRAMA_LABELS = {
  sistemas:            'Sistemas',
  innovacion_agricola: 'Agrícola',
  contaduria:          'Contaduría',
  publico_general:     'Cultura',
}

function SpeakerModal({ speaker, onClose }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl bg-ues-green/40"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white dark:bg-surface-dark-card w-full max-w-5xl max-h-[90vh] rounded-[4rem] shadow-2xl overflow-hidden relative flex flex-col md:flex-row border-2 border-ues-gold/20"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 z-10 w-12 h-12 rounded-2xl bg-gray-900/5 dark:bg-white/5 flex items-center justify-center text-gray-900 dark:text-white hover:bg-ues-green hover:text-white transition-all"
        >
          <X size={24} />
        </button>

        {/* Left Panel: Visual Identity */}
        <div className="w-full md:w-2/5 bg-ues-green/5 dark:bg-white/5 p-16 flex flex-col items-center justify-center text-center border-r border-gray-100 dark:border-white/5">
          <div className="w-56 h-56 rounded-[3.5rem] bg-ues-green flex items-center justify-center mb-10 shadow-2xl relative overflow-hidden group text-ues-gold text-[8rem] font-serif font-black">
            {speaker.nombre.charAt(0)}
          </div>
          <h2 className="text-4xl font-serif font-black text-gray-900 dark:text-white leading-tight mb-4 tracking-tighter">
            {speaker.grado} {speaker.nombre}
          </h2>
          <p className="text-ues-green dark:text-apple font-black text-[12px] uppercase tracking-[0.3em] mb-10">
            {speaker.institucion}
          </p>
          <div className="flex items-center gap-4">
            {[ExternalLink, Share2, Globe].map((Icon, i) => (
              <button key={i} className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 shadow-bento flex items-center justify-center text-gray-400 hover:text-ues-green transition-colors border border-gray-100 dark:border-white/10">
                <Icon size={20} className="text-apple" />
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel: Academic Biography & Sessions */}
        <div className="flex-1 p-10 md:p-16 overflow-y-auto scrollbar-hide bg-white dark:bg-surface-dark-card">
          <div className="mb-16">
            <h4 className="text-[11px] font-black text-gray-300 dark:text-ues-gold/30 uppercase tracking-[0.5em] mb-6">Perfil Académico</h4>
            <p className="text-gray-500 dark:text-gray-400 text-xl leading-relaxed font-medium italic">
              "Investigador y académico de alto nivel, cuya labor impacta directamente en el desarrollo tecnológico y social de nuestra comunidad universitaria."
            </p>
          </div>

          <div>
            <h4 className="text-[11px] font-black text-gray-300 dark:text-ues-gold/30 uppercase tracking-[0.5em] mb-8">Participaciones Programadas</h4>
            <div className="space-y-6">
              {speaker.sesiones.map(s => (
                <div key={s.id} className="p-8 rounded-[2.5rem] bg-gray-50 dark:bg-white/5 border-2 border-transparent hover:border-ues-gold/20 transition-all group shadow-sm hover:shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-ues-green dark:text-ues-gold uppercase tracking-widest bg-ues-gold/10 px-3 py-1 rounded-full">{s.tipo}</span>
                    <span className="text-[12px] font-serif font-black text-gray-400 tabular-nums italic">{s.hora_inicio?.slice(0,5)} — {s.hora_fin?.slice(0,5)}</span>
                  </div>
                  <h5 className="text-gray-900 dark:text-white font-serif font-black text-2xl leading-tight group-hover:text-ues-green transition-colors">{s.nombre}</h5>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Speakers() {
  const [ponentes, setPonentes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [programaFiltro, setProgramaFiltro] = useState('todos')
  const [selectedSpeaker, setSelectedSpeaker] = useState(null)
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    async function cargar() {
      try {
        const data = await sesionesService.getAll()
        const ponentesMap = {}
        
        data.forEach(s => {
          if (!s.ponente_nombre || s.estado !== 'activa') return
          const key = s.ponente_nombre
          if (!ponentesMap[key]) {
            ponentesMap[key] = {
              nombre: s.ponente_nombre,
              grado: s.ponente_grado || '',
              institucion: s.ponente_institucion || 'Institución Invitada',
              programas: s.programa_academico || [],
              sesiones: []
            }
          }
          ponentesMap[key].sesiones.push(s)
          if (s.programa_academico) {
            ponentesMap[key].programas = [...new Set([...ponentesMap[key].programas, ...s.programa_academico])]
          }
        })
        
        setPonentes(Object.values(ponentesMap))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  const filtrados = useMemo(() => {
    return ponentes.filter(p => {
      const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                          p.institucion.toLowerCase().includes(busqueda.toLowerCase())
      const matchProg = programaFiltro === 'todos' || p.programas.includes(programaFiltro)
      return matchBusqueda && matchProg
    })
  }, [ponentes, busqueda, programaFiltro])

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [busqueda, programaFiltro])

  const totalPages = Math.ceil(filtrados.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginados = filtrados.slice(startIndex, startIndex + itemsPerPage)

  return (
    <>
      <SEO title="Conferencistas" />
      <div className="bg-[#FCFCFC] dark:bg-surface-dark-bg min-h-screen">
        
        {/* Editorial Header Section */}
        <header className="pt-40 pb-16 px-6 lg:px-12 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-surface-dark-bg">
          <div className="max-w-[1600px] mx-auto w-full text-center lg:text-left">
            <motion.div initial="initial" animate="animate" variants={staggerContainer} className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
              <div className="max-w-4xl overflow-hidden mx-auto lg:mx-0">
                <motion.div variants={fadeInUp} className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-ues-green flex items-center justify-center text-ues-gold shadow-lg shadow-ues-green/20">
                    <Mic2 size={16} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Comunidad Académica Global</span>
                </motion.div>
                
                <motion.h1 variants={fadeInUp} className="text-4xl sm:text-6xl lg:text-7xl font-serif font-black text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-8 whitespace-nowrap">
                  Nuestra red de <span className="italic text-ues-green dark:text-ues-gold">Mentes</span> Brillantes.
                </motion.h1>
                
                <motion.p variants={fadeInUp} className="text-gray-500 dark:text-gray-400 text-xl font-medium max-w-2xl leading-relaxed mx-auto lg:mx-0">
                  Conoce a los expertos e investigadores que comparten su visión estratégica en la 12va Jornada Académica y Cultural UESSJR.
                </motion.p>
              </div>

              <motion.div variants={fadeInUp} className="flex items-center justify-center gap-6 text-gray-900 dark:text-gray-100 bg-ues-green/5 p-8 rounded-[3rem] border-2 border-ues-gold/20 shadow-bento shrink-0 mx-auto lg:mx-0">
                <span className="font-serif font-black italic text-5xl tabular-nums leading-none text-ues-green dark:text-ues-gold">{ponentes.length}</span>
                <span className="text-[11px] font-black uppercase tracking-widest leading-tight text-gray-400">Ponentes<br/>Invitados</span>
              </motion.div>
            </motion.div>
          </div>
        </header>

        {/* Filters Section */}
        <section className="sticky top-[89px] z-40 px-6 lg:px-12 py-6 bg-white/90 dark:bg-surface-dark-bg/90 backdrop-blur-xl border-b border-gray-100 dark:border-white/5">
          <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
            
            <div className="flex items-center gap-3 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-hide">
              <button
                onClick={() => setProgramaFiltro('todos')}
                className={`px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border-2 ${
                  programaFiltro === 'todos' 
                    ? 'bg-gray-900 dark:bg-ues-gold text-white dark:text-ues-green border-transparent shadow-xl' 
                    : 'text-gray-900 dark:text-gray-100 border-gray-100 dark:border-white/10 hover:border-ues-gold/30'
                }`}
              >
                Todos los Ejes
              </button>
              {Object.entries(PROGRAMA_LABELS).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setProgramaFiltro(val)}
                  className={`px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border-2 ${
                    programaFiltro === val 
                      ? 'bg-ues-green text-white border-transparent shadow-xl shadow-ues-green/20' 
                      : 'text-gray-900 dark:text-gray-100 border-gray-100 dark:border-white/10 hover:border-ues-gold/30'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-96 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-ues-green transition-colors" />
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o institución..."
                className="w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-full text-sm font-bold text-gray-900 dark:text-white focus:ring-4 ring-ues-green/5 outline-none transition-all placeholder:text-gray-400"
              />
            </div>
          </div>
        </section>

        {/* Grid Section - Wider Cards */}
        <main className="px-6 lg:px-12 py-24">
          <div className="max-w-[1600px] mx-auto">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {[1,2,3,4].map(i => (
                  <div key={i} className="aspect-[21/9] bg-gray-100 dark:bg-white/5 rounded-[3rem] animate-pulse" />
                ))}
              </div>
            ) : filtrados.length === 0 ? (
              <div className="py-40 text-center">
                 <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-gray-100">
                    <Search size={44} className="text-gray-200" />
                 </div>
                 <p className="text-gray-400 font-serif italic text-2xl">No se encontraron ponentes con esos criterios.</p>
              </div>
            ) : (
              <>
                <motion.div 
                  variants={staggerContainer} initial="initial" animate="animate"
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
                >
                  {paginados.map((p) => (
                    <motion.div
                      key={p.nombre}
                      variants={fadeInUp}
                      onClick={() => setSelectedSpeaker(p)}
                      className="group bg-white dark:bg-surface-dark-card p-6 rounded-[3rem] border-2 border-ues-gold/10 shadow-bento dark:shadow-bento-dark hover:-translate-y-2 hover:border-ues-gold/40 transition-all duration-500 cursor-pointer flex flex-row items-center gap-6 relative overflow-hidden h-[240px]"
                    >
                      {/* Editorial Initial Watermark */}
                      <div className="absolute top-0 right-0 p-6 text-7xl font-serif font-black text-ues-gold/[0.03] pointer-events-none select-none italic group-hover:scale-110 transition-transform">
                         {p.nombre.charAt(0)}
                      </div>
                      
                      {/* Portrait Frame */}
                      <div className="w-28 h-28 shrink-0 rounded-[2rem] bg-ues-green flex items-center justify-center text-ues-gold text-4xl font-serif font-black shadow-lg group-hover:scale-105 transition-transform ring-6 ring-ues-gold/5">
                        {p.nombre.charAt(0)}
                      </div>

                      <div className="flex-1 flex flex-col justify-center overflow-hidden pr-4">
                        <div className="mb-3">
                          <span className="inline-block px-2.5 py-1 rounded-full bg-ues-gold/10 text-ues-green dark:text-ues-gold text-[8px] font-black uppercase tracking-widest mb-2">
                            {p.grado || 'Académico'}
                          </span>
                          <h3 className="text-xl font-serif font-black text-gray-900 dark:text-white leading-tight group-hover:text-ues-green transition-colors tracking-tighter truncate">{p.nombre}</h3>
                        </div>

                        <p className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.1em] mb-6 line-clamp-1 border-l-2 border-ues-gold/20 pl-3">{p.institucion}</p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="text-[9px] font-black uppercase tracking-widest text-ues-green dark:text-ues-gold">Ver Perfil</span>
                          <ChevronRight size={14} className="text-apple" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-24 flex items-center justify-center gap-8">
                    <button 
                      onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                      disabled={currentPage === 1}
                      className="w-14 h-14 rounded-2xl border-2 border-gray-100 flex items-center justify-center text-gray-400 hover:border-ues-green hover:text-ues-green transition-all disabled:opacity-20"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    
                    <div className="flex items-center gap-4">
                      <span className="font-serif font-black italic text-3xl text-ues-green">{currentPage}</span>
                      <div className="w-10 h-px bg-gray-100" />
                      <span className="font-serif font-black italic text-xl text-gray-300">{totalPages}</span>
                    </div>

                    <button 
                      onClick={() => { setCurrentPage(prev => Math.min(prev + 1, totalPages)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                      disabled={currentPage === totalPages}
                      className="w-14 h-14 rounded-2xl border-2 border-gray-100 flex items-center justify-center text-gray-400 hover:border-ues-green hover:text-ues-green transition-all disabled:opacity-20"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        <AnimatePresence>
          {selectedSpeaker && (
            <SpeakerModal 
              speaker={selectedSpeaker} 
              onClose={() => setSelectedSpeaker(null)} 
            />
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

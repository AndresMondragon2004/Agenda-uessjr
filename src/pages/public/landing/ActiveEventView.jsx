import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight, Megaphone, Terminal, Leaf,
  Calculator, Users, CalendarDays, Mic2,
  GraduationCap, Star, MapPin
} from 'lucide-react'
import { sesionesService } from '../../../services/sesiones.service'
import { inscripcionesService } from '../../../services/inscripciones.service'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const EJES = [
  { icon: Terminal,   titulo: 'Sistemas', programa: 'sistemas' },
  { icon: Leaf,       titulo: 'Agrícola', programa: 'innovacion_agricola' },
  { icon: Calculator, titulo: 'Contaduría', programa: 'contaduria' },
  { icon: Users,      titulo: 'Comunidad', programa: 'publico_general' },
]

function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="bg-white dark:bg-surface-dark-card p-6 rounded-[2.5rem] border-2 border-ues-gold/10 shadow-bento dark:shadow-bento-dark flex flex-col items-center text-center group relative overflow-hidden">
      <div className="w-12 h-12 rounded-2xl bg-ues-green flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-ues-green/20">
        <Icon size={20} className="text-apple" />
      </div>
      <span className="text-3xl font-serif font-black text-gray-900 dark:text-white mb-1 tabular-nums italic">{value}</span>
      <span className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 group-hover:text-ues-green transition-colors">{label}</span>
    </div>
  )
}

function SessionCard({ ses, idx }) {
  return (
    <motion.div
      variants={fadeInUp}
      className="group bg-white dark:bg-surface-dark-card rounded-[3rem] border-2 border-ues-gold/20 shadow-bento dark:shadow-bento-dark p-8 hover:-translate-y-2 transition-all duration-500 flex flex-col relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-8 text-6xl font-serif font-black text-ues-green/[0.03] dark:text-apple/[0.03] italic pointer-events-none select-none">
        0{idx+1}
      </div>
      
      <div className="flex items-start justify-between mb-8">
        <span className="bg-ues-green text-ues-gold px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] border border-ues-gold/30">
          {ses.tipo || 'MAGISTRAL'}
        </span>
        <p className="font-serif font-black text-xl tabular-nums italic text-ues-gold">
          {ses.hora_inicio?.slice(0, 5)}
        </p>
      </div>
      
      <h4 className="text-xl font-serif font-black text-gray-900 dark:text-white mb-6 leading-tight group-hover:text-ues-green dark:group-hover:text-ues-gold transition-colors line-clamp-2 min-h-[4rem]">
        {ses.nombre}
      </h4>

      <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-apple" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 truncate max-w-[120px]">{ses.escenarios?.nombre || 'AUDITORIO'}</span>
        </div>
        <Link to={`/agenda/${ses.id}`} className="w-10 h-10 rounded-xl bg-ues-green text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-ues-green/20">
          <ArrowRight size={18} />
        </Link>
      </div>
    </motion.div>
  )
}

export default function ActiveEventView({ jornada }) {
  const navigate = useNavigate()
  const [proximas, setProximas] = useState([])
  const [stats, setStats] = useState({ sesiones: 0, ponentes: 0, inscripciones: 0 })

  useEffect(() => {
    async function load() {
      if (!jornada) return
      try {
        const [data, totalInsc] = await Promise.all([
          sesionesService.getByJornada(jornada.id),
          inscripcionesService.getTotalInscripciones()
        ])
        const activas = data.filter(s => s.estado === 'activa')
        setProximas(activas.slice(0, 3))
        
        const uniquePonentes = new Set(activas.map(s => s.ponente_nombre).filter(Boolean))
        
        setStats({
          sesiones: activas.length,
          ponentes: uniquePonentes.size,
          inscripciones: totalInsc?.data || 0
        })
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [jornada])

  return (
    <div className="bg-[#FCFCFC] dark:bg-surface-dark-bg selection:bg-ues-gold/30">
      
      {/* Editorial Hero - Centered & Responsive */}
      <section className="relative min-h-[92vh] flex items-center justify-center pt-32 pb-20 overflow-hidden border-b border-gray-100 dark:border-white/5">
        <div className="absolute inset-0 bg-ues-green/[0.01] pointer-events-none" />

        <div className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-12 w-full text-center flex flex-col items-center">
          <motion.div initial="initial" animate="animate" variants={staggerContainer} className="max-w-5xl">
            <motion.div variants={fadeInUp} className="flex items-center gap-3 bg-ues-green text-white px-5 py-2 rounded-full mb-10 w-fit shadow-2xl shadow-ues-green/30 border border-ues-gold/30 mx-auto">
              <div className="w-2 h-2 rounded-full bg-apple animate-pulse shadow-[0_0_10px_#84CC16]" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Evento en Tiempo Real</span>
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-5xl sm:text-7xl lg:text-[8rem] font-serif font-black text-gray-900 dark:text-white leading-[0.9] tracking-tighter mb-6">
              Liderazgo que<br/><span className="italic text-ues-green dark:text-ues-gold underline decoration-ues-gold/20">Trasciende</span>.
            </motion.h1>

            {/* Watermark below text - Deep Green & High Visibility */}
            <motion.div variants={fadeInUp} className="text-[10vw] font-serif font-black text-[#153224] dark:text-apple/[0.1] leading-none mb-10 select-none opacity-40">
              12va FIN
            </motion.div>
            
            <motion.p variants={fadeInUp} className="text-gray-500 dark:text-gray-400 text-lg sm:text-2xl max-w-3xl font-medium leading-relaxed mb-16 mx-auto">
              Accede al cronograma oficial, asiste a las conferencias de vanguardia y valida tus insignias de excelencia institucional.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-8">
              <Link to="/agenda" className="group flex items-center gap-4 bg-ues-green text-white px-12 py-6 rounded-full font-bold uppercase text-sm tracking-[0.3em] hover:bg-emerald-900 transition-all shadow-2xl shadow-ues-green/40">
                Explorar Cronograma <ArrowRight size={20} />
              </Link>
              <Link to="/mi-agenda" className="group flex items-center gap-4 bg-white dark:bg-white/5 border-2 border-ues-gold/30 px-12 py-6 rounded-full font-black uppercase text-sm tracking-[0.3em] text-gray-900 dark:text-white hover:bg-ues-gold hover:text-white transition-all shadow-bento">
                Mi Agenda <Star size={20} className="text-apple" fill="currentColor" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Specialty Tracks Bento - Smaller Scale */}
      <section className="py-24 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className="flex flex-col items-center text-center gap-6 mb-16">
          <h2 className="text-4xl sm:text-5xl font-serif font-black text-gray-900 dark:text-white leading-tight tracking-tighter">
            Ejes de <span className="italic text-ues-green dark:text-ues-gold">Especialidad</span>.
          </h2>
          <p className="text-gray-400 font-medium text-lg max-w-2xl">Filtra el contenido especializado según tu perfil académico institucional.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {EJES.map((eje, i) => (
            <motion.div 
              key={i}
              whileInView="animate" initial="initial" viewport={{ once: true }} variants={fadeInUp}
              onClick={() => navigate(`/agenda?programa=${eje.programa}`)}
              className="bg-white dark:bg-surface-dark-card p-10 rounded-[3.5rem] border-2 border-ues-gold/10 shadow-bento dark:shadow-bento-dark hover:-translate-y-2 hover:border-ues-gold/40 transition-all duration-500 cursor-pointer group flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-[1.5rem] bg-ues-green/5 dark:bg-white/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-inner border border-ues-gold/10">
                <eje.icon size={28} className="text-apple" />
              </div>
              <h3 className="text-xl font-serif font-black text-gray-900 dark:text-white mb-4 leading-tight">{eje.titulo}</h3>
              <p className="text-ues-green/30 dark:text-ues-gold/30 text-[9px] font-black uppercase tracking-[0.5em] mb-8">Ver Programa</p>
              <div className="w-12 h-12 rounded-2xl border-2 border-gray-100 dark:border-white/10 flex items-center justify-center group-hover:bg-ues-green group-hover:text-white transition-all">
                <ArrowRight size={20} />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Up Next with REAL STATS */}
      <section className="py-24 px-6 lg:px-12 bg-white dark:bg-surface-dark-bg border-y border-gray-100 dark:border-white/5">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-20 items-center">
            <div className="lg:col-span-1 flex flex-col items-center lg:items-start text-center lg:text-left">
              <span className="text-[10px] font-black text-ues-gold uppercase tracking-[0.5em] mb-4">Alcance Real</span>
              <div className="flex flex-col">
                <span className="text-6xl font-serif font-black text-gray-900 dark:text-white tabular-nums italic">{stats.inscripciones}</span>
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-2">Registros Confirmados</span>
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="flex items-center gap-6 mb-12">
                <div className="px-6 py-2 rounded-full bg-ues-green text-ues-gold text-[10px] font-black uppercase tracking-[0.5em] shadow-xl">
                  Próximas Sesiones
                </div>
                <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {proximas.map((ses, i) => (
                  <SessionCard key={ses.id} ses={ses} idx={i} />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Link to="/agenda" className="inline-flex items-center gap-3 text-ues-green dark:text-ues-gold font-black text-base uppercase tracking-[0.3em] group">
              <span className="group-hover:underline underline-offset-[8px] decoration-2 decoration-apple/50 transition-all">Ver Agenda Completa</span>
              <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Editorial Banner */}
      <section className="py-32 bg-ues-green relative overflow-hidden flex flex-col items-center">
        <div className="absolute inset-0 opacity-10 bg-[url('/images/campus/aula-magna-1.jpg')] bg-cover bg-center grayscale" />
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-[2rem] bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-10 border border-white/20 shadow-2xl">
            <Megaphone size={40} className="text-apple" />
          </div>
          <h2 className="text-5xl sm:text-7xl lg:text-[8rem] font-serif font-black text-white leading-[0.9] tracking-tighter mb-12">
            Eleva tu<br/><span className="italic text-ues-gold underline decoration-ues-gold/20 text-apple">Potencial</span>.
          </h2>
          <div className="flex flex-wrap justify-center gap-8">
            <Link to="/proponer" className="bg-ues-gold text-ues-green px-12 py-6 rounded-full font-black uppercase text-xs tracking-[0.3em] hover:bg-white hover:scale-105 transition-all shadow-2xl shadow-ues-gold/30">
              Proponer Ponencia
            </Link>
          </div>
        </div>
        
        {/* Final Branding Centered - Fixed Original Colors */}
        <div className="mt-40 pt-16 border-t border-white/10 w-full flex flex-col items-center gap-12 relative z-10">
          <div className="text-center">
            <span className="text-[14px] font-black text-ues-gold uppercase tracking-[0.6em] block mb-4">12va edición</span>
            <p className="text-emerald-100/40 text-xl font-medium italic">"Cultura que inspira, conocimiento que transforma"</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-16 opacity-100 dark:grayscale dark:brightness-0 dark:invert dark:opacity-40 transition-all duration-700 items-center">
            <img src="https://sic.cultura.gob.mx/imagenes_cache/universidad_4260_g_74199.png" className="h-10 object-contain" alt="UMB" />
            <img src="/images/logos/ues-sjr.png" className="h-10 object-contain" alt="UES SJR" />
          </div>
          
          <p className="text-white/20 font-serif font-black text-2xl tracking-tighter uppercase mb-12">UESSJR · 2026</p>
        </div>
      </section>

    </div>
  )
}

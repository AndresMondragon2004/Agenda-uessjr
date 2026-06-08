import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Trophy, Award, 
  Star, ArrowRight, Loader2, 
  GraduationCap
} from 'lucide-react'
import { inscripcionesService } from '../../../services/inscripciones.service'
import { sesionesService } from '../../../services/sesiones.service'
import { useAuth } from '../../../context/AuthContext'

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

export default function PostEventView() {
  const { estudiante, isLoggedIn } = useAuth()
  const [stats, setStats] = useState({ totalParticipantes: 0, totalSesiones: 0 })
  const [loading, setLoading] = useState(true)
  const [showCert, setShowCert] = useState(false)

  useEffect(() => {
    async function loadStats() {
      try {
        const [totalInsc, sesiones] = await Promise.all([
          inscripcionesService.getTotalInscripciones(),
          sesionesService.getAll()
        ])
        setStats({
          totalParticipantes: totalInsc?.data || 0,
          totalSesiones: sesiones?.filter(s => s.estado === 'finalizada').length || sesiones?.length || 0
        })
        if (isLoggedIn && estudiante) {
          const misInsc = await inscripcionesService.getByEstudiante(estudiante.id)
          setShowCert(misInsc && misInsc.length > 0)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [estudiante, isLoggedIn])

  if (loading) return (
    <div className="min-h-screen bg-[#FCFCFC] dark:bg-surface-dark-bg flex items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-ues-green" />
    </div>
  )

  return (
    <div className="bg-[#FCFCFC] dark:bg-surface-dark-bg selection:bg-ues-gold/30">
      
      {/* Editorial Hero: Closure - Centered & Scaled Down */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-20 overflow-hidden border-b border-gray-100 dark:border-white/5">
        <div className="absolute inset-0 bg-ues-green/[0.01] dark:bg-apple/[0.01]" />
        
        <div className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-12 w-full text-center flex flex-col items-center">
          <motion.div initial="initial" animate="animate" variants={staggerContainer} className="max-w-5xl">
            
            <motion.h1 variants={fadeInUp} className="text-6xl sm:text-7xl lg:text-[8rem] font-serif font-black text-gray-900 dark:text-white leading-[0.9] tracking-tighter mb-10">
              Impacto que<br/><span className="italic text-ues-green dark:text-ues-gold underline decoration-ues-gold/10">Trasciende</span>.
            </motion.h1>

            {/* Watermark below text - Deep Green & High Visibility */}
            <motion.div variants={fadeInUp} className="text-[10vw] font-serif font-black text-[#153224] dark:text-apple/[0.1] leading-none mb-10 select-none opacity-40">
              12va FIN
            </motion.div>
            
            <motion.p variants={fadeInUp} className="text-gray-500 dark:text-gray-400 text-lg sm:text-2xl max-w-3xl font-medium leading-relaxed mb-16 mx-auto">
              La Jornada Académica ha concluido su fase presencial. Gracias por ser el motor de este despliegue histórico de conocimiento institucional.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-6">
              <Link to="/agenda" className="group flex items-center gap-4 bg-ues-green text-white px-10 py-5 rounded-full font-bold uppercase text-xs tracking-widest hover:bg-emerald-900 transition-all shadow-2xl">
                Consultar Memorias <ArrowRight size={18} />
              </Link>
              {showCert && (
                <Link to="/mi-agenda" className="group flex items-center gap-4 bg-white dark:bg-white/5 border-2 border-ues-gold/20 px-10 py-5 rounded-full font-bold uppercase text-xs tracking-widest text-gray-900 dark:text-white hover:bg-ues-gold hover:text-white transition-all shadow-xl">
                  Descargar Constancias <Award size={18} className="text-apple group-hover:text-white" />
                </Link>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Impact Stats Bento - Much smaller */}
      <section className="py-24 px-6 lg:px-12 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <motion.div 
            whileInView="animate" initial="initial" viewport={{ once: true }} variants={fadeInUp}
            className="bg-white dark:bg-surface-dark-card p-10 rounded-[3rem] border-2 border-ues-gold/10 shadow-bento dark:shadow-bento-dark flex flex-col justify-center items-center text-center relative overflow-hidden group"
          >
            <div className="absolute -right-8 -top-8 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <Trophy size={150} className="text-ues-green dark:text-apple" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-ues-green flex items-center justify-center text-ues-gold mb-6 shadow-lg shadow-ues-green/20 mx-auto">
                <Star size={24} fill="currentColor" className="text-apple" />
              </div>
              <h2 className="text-3xl font-serif font-black text-gray-900 dark:text-white mb-2 tracking-tighter">
                <span className="italic text-ues-green dark:text-ues-gold">Excelencia</span> Académica
              </h2>
              <p className="text-gray-400 text-sm font-medium mb-6">Resultados institucionales récord.</p>
              
              <div className="flex flex-col items-center">
                <span className="text-6xl font-serif font-black text-gray-900 dark:text-white tabular-nums italic">{stats.totalParticipantes}</span>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mt-2">Inscripciones Totales</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileInView="animate" initial="initial" viewport={{ once: true }} variants={fadeInUp}
            className="bg-white dark:bg-surface-dark-card p-10 rounded-[3rem] border-2 border-ues-gold/10 shadow-bento dark:shadow-bento-dark flex flex-col justify-center items-center text-center group"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-ues-gold/10 flex items-center justify-center text-ues-gold mb-6 mx-auto border border-ues-gold/20">
                <GraduationCap size={24} />
              </div>
              <h2 className="text-3xl font-serif font-black text-gray-900 dark:text-white mb-2 tracking-tighter">
                <span className="italic text-ues-green dark:text-ues-gold">Sesiones</span> Exitosas
              </h2>
              <p className="text-gray-400 text-sm font-medium mb-6">Impacto multidisciplinario.</p>
              
              <div className="flex flex-col items-center">
                <span className="text-6xl font-serif font-black text-gray-900 dark:text-white tabular-nums italic">{stats.totalSesiones}</span>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mt-2">Eventos Realizados</span>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Institutional Final Branding - Fixed Original Colors & Centering */}
      <section className="py-24 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-surface-dark-bg">
        <div className="max-w-4xl mx-auto px-6 text-center flex flex-col items-center gap-12">
          <div>
            <span className="text-[14px] font-black text-ues-gold uppercase tracking-[0.6em] block mb-4">12va edición</span>
            <p className="text-gray-400 text-xl font-medium italic leading-none tracking-tight">"Cultura que inspira, conocimiento que transforma"</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-16 opacity-100 dark:grayscale dark:brightness-0 dark:invert dark:opacity-40 transition-all items-center hover:opacity-100">
            <img src="https://sic.cultura.gob.mx/imagenes_cache/universidad_4260_g_74199.png" className="h-14 object-contain" alt="UMB" />
            <img src="/images/logos/ues-sjr.png" className="h-14 object-contain" alt="UES SJR" />
          </div>
          
          <p className="text-gray-900 dark:text-white font-serif font-black text-2xl tracking-tighter uppercase opacity-80">UESSJR · 2026</p>
        </div>
      </section>

    </div>
  )
}

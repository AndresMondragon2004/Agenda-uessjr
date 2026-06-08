import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowRight,
  Terminal, Leaf, Calculator, Users,
  Rocket, Star,
  GraduationCap
} from 'lucide-react'

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
  { icon: Terminal,   color: '#D4A017', titulo: 'Sistemas', desc: 'IA, Ciberseguridad y Web 3.0' },
  { icon: Leaf,       color: '#D4A017', titulo: 'Agrícola', desc: 'Sustentabilidad e Innovación' },
  { icon: Calculator, color: '#D4A017', titulo: 'Contaduría', desc: 'Finanzas y Gestión Fiscal' },
  { icon: Users,      color: '#D4A017', titulo: 'Comunidad', desc: 'Cultura y Sentido Humano' },
]

export default function PreEventView({ jornada }) {
  return (
    <div className="bg-[#FCFCFC] dark:bg-surface-dark-bg selection:bg-ues-gold/30">
      
      {/* Editorial Hero Section - Centered & Scaled */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-20 overflow-hidden border-b border-gray-100 dark:border-white/5">
        <div className="absolute inset-0 bg-ues-green/[0.01] dark:bg-apple/[0.01]" />

        <div className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-12 w-full text-center">
          <motion.div initial="initial" animate="animate" variants={staggerContainer} className="flex flex-col items-center">
            <motion.div variants={fadeInUp} className="flex items-center gap-3 bg-ues-green text-ues-gold px-4 py-2 rounded-full mb-8 w-fit shadow-xl shadow-ues-green/20 border border-ues-gold/20">
              <Star size={14} fill="currentColor" className="text-apple" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Estándar Académico Global</span>
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-5xl sm:text-7xl lg:text-[8rem] font-serif font-black text-gray-900 dark:text-white leading-[0.9] tracking-tighter mb-6">
              El Conocimiento<br/><span className="italic text-ues-green dark:text-ues-gold underline decoration-ues-gold/20">Evoluciona</span>.
            </motion.h1>

            {/* Watermark below text - Deep Green & High Visibility */}
            <motion.div variants={fadeInUp} className="text-[10vw] font-serif font-black text-[#153224] dark:text-apple/[0.1] leading-none mb-10 select-none opacity-40">
              12va FIN
            </motion.div>
            
            <motion.p variants={fadeInUp} className="text-gray-500 dark:text-gray-400 text-lg sm:text-2xl max-w-3xl font-medium leading-relaxed mb-12 mx-auto">
              Prepárate para la 12va Jornada Académica UESSJR. Una semana diseñada para inspirar, conectar y transformar tu visión profesional.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-6">
              <Link to="/agenda" className="group flex items-center gap-3 bg-ues-green text-white px-10 py-5 rounded-full font-bold uppercase text-xs tracking-[0.2em] hover:bg-emerald-900 transition-all shadow-2xl shadow-ues-green/40">
                Explorar Calendario <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/proponer" className="group flex items-center gap-3 bg-white dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 px-10 py-5 rounded-full font-bold uppercase text-xs tracking-[0.2em] text-gray-900 dark:text-white hover:border-ues-gold transition-all shadow-bento">
                Ser Ponente <Rocket size={18} className="text-apple" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Bento Layout - grid-cols-6 - Scaled Down */}
      <section className="py-24 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
          
          {/* Main Bento Feature */}
          <motion.div 
            whileInView="animate" initial="initial" viewport={{ once: true }} variants={fadeInUp}
            className="md:col-span-4 lg:col-span-4 row-span-2 bg-white dark:bg-surface-dark-card p-10 rounded-[3rem] border-2 border-ues-gold/10 shadow-bento dark:shadow-bento-dark flex flex-col justify-between overflow-hidden relative group"
          >
            <div className="absolute -right-16 -bottom-16 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
              <GraduationCap size={400} className="text-ues-green dark:text-ues-gold" />
            </div>
            <div>
              <div className="w-14 h-14 rounded-2xl bg-ues-green flex items-center justify-center text-ues-gold mb-8 shadow-lg shadow-ues-green/20">
                <Star size={28} fill="currentColor" className="text-apple" />
              </div>
              <h2 className="text-4xl sm:text-5xl font-serif font-black text-gray-900 dark:text-white leading-[1.1] mb-6 tracking-tighter">
                Formación con<br/><span className="italic text-ues-green dark:text-ues-gold underline decoration-ues-gold/20">Sentido Humano</span>.
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-xl leading-relaxed max-w-md">
                Nuestra jornada trasciende las aulas, integrando tecnología de vanguardia con los valores institucionales.
              </p>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              {['Investigación', 'Cultura', 'Innovación'].map((tag, i) => (
                <span key={i} className="px-5 py-2.5 rounded-full bg-ues-green/5 dark:bg-white/5 border border-ues-gold/10 text-[9px] font-black uppercase tracking-[0.3em] text-ues-green/60 dark:text-ues-gold/60">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Statistics Box */}
          <motion.div 
            whileInView="animate" initial="initial" viewport={{ once: true }} variants={fadeInUp}
            className="md:col-span-2 lg:col-span-2 bg-ues-green p-10 rounded-[3rem] shadow-2xl shadow-ues-green/30 flex flex-col justify-center items-center text-center relative overflow-hidden group border-2 border-ues-gold/10"
          >
            <div className="absolute inset-0 bg-ues-gold/5 -translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
            <span className="text-7xl sm:text-9xl font-serif font-black mb-2 text-white tabular-nums group-hover:scale-110 transition-transform duration-500 relative z-10 italic">30+</span>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-ues-gold relative z-10">Conferencias Magistrales</span>
          </motion.div>

          {/* Ejes temáticos - grid adaptive */}
          {EJES.map((eje, i) => (
            <motion.div 
              key={i}
              whileInView="animate" initial="initial" viewport={{ once: true }} variants={fadeInUp}
              className="md:col-span-2 lg:col-span-2 bg-white dark:bg-surface-dark-card p-10 rounded-[2.5rem] border-2 border-ues-gold/10 shadow-bento hover:-translate-y-2 hover:border-ues-gold transition-all duration-500 group"
            >
              <div className="w-12 h-12 rounded-xl bg-ues-green/5 dark:bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner border border-ues-gold/10">
                <eje.icon size={24} className="text-apple" />
              </div>
              <h3 className="text-2xl font-serif font-black text-gray-900 dark:text-white mb-3 tracking-tight">{eje.titulo}</h3>
              <p className="text-gray-400 text-base font-medium leading-relaxed line-clamp-2">{eje.desc}</p>
            </motion.div>
          ))}

        </div>
      </section>

      {/* Hero-like Final Call */}
      <section className="py-32 bg-ues-green relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/images/campus/aula-magna-1.jpg')] bg-cover bg-fixed grayscale" />
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 relative z-10 text-center flex flex-col items-center">
           <motion.div whileInView="animate" initial="initial" viewport={{ once: true }} variants={fadeInUp}>
              <h2 className="text-4xl sm:text-7xl font-serif font-black text-white leading-none tracking-tighter mb-12">
                Donde la <span className="italic text-ues-gold">Visión</span> se hace Realidad.
              </h2>
              <Link to="/agenda" className="inline-flex items-center gap-4 bg-white text-ues-green px-12 py-6 rounded-full font-black uppercase text-xs tracking-[0.2em] hover:bg-ues-gold hover:text-white transition-all shadow-2xl">
                Ver Programa Completo
              </Link>
           </motion.div>
           
           {/* Final Branding Centered */}
           <div className="mt-32 pt-16 border-t border-white/10 w-full flex flex-col items-center gap-12">
              <div className="text-center">
                <span className="text-[14px] font-black text-ues-gold uppercase tracking-[0.6em] block mb-4">12va edición</span>
                <p className="text-emerald-100/40 text-xl font-medium italic">"Cultura que inspira, conocimiento que transforma"</p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-16 opacity-100 dark:grayscale dark:brightness-0 dark:invert dark:opacity-40 transition-all duration-700 items-center">
                <img src="https://sic.cultura.gob.mx/imagenes_cache/universidad_4260_g_74199.png" className="h-10 object-contain" alt="UMB" />
                <img src="/images/logos/ues-sjr.png" className="h-10 object-contain" alt="UES SJR" />
              </div>
              
              <p className="text-white/20 font-serif font-black text-2xl tracking-tighter uppercase">UESSJR · 2026</p>
           </div>
        </div>
      </section>

    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowRight,
  Terminal, Leaf, Calculator, Users,
  Rocket, BookOpen, Mic2, Star
} from 'lucide-react'
import { parseSafeDate } from '../../../utils/dateHelper'

/* ─── Hook: detecta modo oscuro en tiempo real ───────────────────────────── */
function useDarkMode() {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains('dark')
  )
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains('dark'))
    )
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return isDark
}

/* ─── Intersection Observer Hook ────────────────────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, vis]
}

/* ─── Ejes Académicos (Reutilizados) ─── */
const EJES = [
  {
    icon: Terminal, titulo: 'Ingeniería en sistemas',
    desc: 'IA, Ciberseguridad y Desarrollo.',
    programa: 'sistemas', acento: '#D97706',
    bg: 'from-amber-100 to-amber-50', bgDark: 'dark:bg-amber-950/20',
    border: 'border-amber-200'
  },
  {
    icon: Leaf, titulo: 'Innovación agrícola',
    desc: 'Sustentabilidad y Biotecnología.',
    programa: 'innovacion_agricola', acento: '#16A34A',
    bg: 'from-emerald-100 to-emerald-50', bgDark: 'dark:bg-emerald-950/20',
    border: 'border-emerald-200'
  },
  {
    icon: Calculator, titulo: 'Licenciatura en contaduría',
    desc: 'Finanzas y Gestión Empresarial.',
    programa: 'contaduria', acento: '#2563EB',
    bg: 'from-blue-100 to-blue-50', bgDark: 'dark:bg-indigo-950/20',
    border: 'border-blue-200'
  },
  {
    icon: Users, titulo: 'Público en general',
    desc: 'Cultura, Arte y Comunidad.',
    programa: 'publico_general', acento: '#7C3AED',
    bg: 'from-violet-100 to-violet-50', bgDark: 'dark:bg-purple-950/20',
    border: 'border-purple-200'
  },
]

/* ─── Cronómetro Premium (Grande) ────────────────────────────────────────── */
function LargeCountdown({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 })

  useEffect(() => {
    if (!targetDate) return
    const timer = setInterval(() => {
      const diff = parseSafeDate(targetDate) - new Date()
      if (diff > 0) {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / 1000 / 60) % 60),
          s: Math.floor((diff / 1000) % 60),
        })
      } else {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 })
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  const items = [
    { label: 'Días', val: timeLeft.d },
    { label: 'Hrs',  val: timeLeft.h },
    { label: 'Min',  val: timeLeft.m },
    { label: 'Seg',  val: timeLeft.s },
  ]

  return (
    <div className="flex flex-wrap justify-center gap-4 sm:gap-8 max-w-4xl mx-auto">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col items-center group">
          <div className="relative">
            {/* Contenedor Editorial */}
            <div className="w-20 h-24 sm:w-32 sm:h-40 bg-white/10 backdrop-blur-2xl rounded-[2rem] border border-white/20 flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-2 group-hover:border-amber-400/40">
              <span className="text-4xl sm:text-7xl font-black text-white tracking-tighter drop-shadow-2xl">
                {String(item.val).padStart(2, '0')}
              </span>
              
              {/* Línea decorativa "Clock Hand" */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1 h-8 bg-gradient-to-b from-amber-400 to-transparent rounded-full opacity-40 group-hover:h-12 transition-all duration-700" />
            </div>

            {/* Separadores entre bloques (solo desktop) */}
            {i < items.length - 1 && (
              <div className="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2 text-white/20 font-black text-3xl">
                :
              </div>
            )}
          </div>
          
          <div className="mt-4 sm:mt-6 flex flex-col items-center">
            <span className="text-[10px] sm:text-xs font-black text-amber-400 uppercase tracking-[0.3em] group-hover:tracking-[0.4em] transition-all duration-500">
              {item.label}
            </span>
            <div className="w-4 h-0.5 bg-amber-400/30 mt-1 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function PreEventView({ jornada }) {
  const isDark = useDarkMode()
  const [viviremosRef, viviremosVis] = useInView()
  const [ctaRef,       ctaVis]       = useInView()

  return (
    <div className="min-h-screen bg-[#05140B] selection:bg-amber-400 selection:text-[#05140B]">
      
      {/* 1. Hero Section: Countdown focus */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gray-900">
        {/* Background image with high clarity */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/campus/aula-magna-1.jpg" 
            className="w-full h-full object-cover opacity-90 scale-105"
            alt=""
          />
          {/* Neutral gradient for legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-400 text-[#05140B] px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest mb-8 anim-reveal anim-stagger-1">
            <Rocket size={14} /> Próximamente
          </div>
          
          <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black text-white tracking-tight mb-6 anim-reveal anim-stagger-2">
            Estamos <span className="text-amber-300">preparando</span> algo histórico
          </h1>
          
          <p className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto mb-16 anim-reveal anim-stagger-3 leading-relaxed">
            La 12va Jornada Académica y Cultural de la UES San José del Rincón está por comenzar. Únete a la mayor celebración del conocimiento.
          </p>

          <div className="anim-reveal anim-stagger-4">
            <LargeCountdown targetDate={jornada?.fecha_inicio ? `${jornada.fecha_inicio}T09:00:00` : '2026-05-11T09:00:00'} />
          </div>

          <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 anim-reveal anim-stagger-5">
            <Link to="/agenda" className="w-full sm:w-auto bg-white text-[#05140B] px-10 py-5 rounded-2xl font-black uppercase text-sm hover:bg-amber-300 transition-all shadow-xl hover:-translate-y-1">
              Ver Programa Preliminar
            </Link>
            <Link to="/registro" className="w-full sm:w-auto border-2 border-white/20 text-white px-10 py-5 rounded-2xl font-black uppercase text-sm hover:bg-white/10 transition-all backdrop-blur-md">
              Registrarme ahora
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Qué esperar (Stats Teaser) */}
      <section className="bg-[#F5F4F0] dark:bg-[#05140B] py-24 rounded-t-[3rem] -mt-10 relative z-20" ref={viviremosRef}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            <div className={`lg:col-span-1 ${viviremosVis ? 'anim-reveal' : 'opacity-0'}`}>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white leading-tight mb-6">
                Lo que <span className="text-[#163020] dark:text-emerald-500">viviremos</span> en esta edición
              </h2>
              <div className="space-y-6">
                {[
                  { icon: BookOpen, text: 'Talleres prácticos de alta tecnología' },
                  { icon: Mic2, text: 'Conferencistas nacionales e internacionales' },
                  { icon: Star, text: 'Presentaciones culturales de primer nivel' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 text-gray-600 dark:text-gray-400 font-bold">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-[#163020] dark:text-emerald-400">
                      <item.icon size={20} />
                    </div>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {EJES.map((eje, i) => (
                <div
                  key={i}
                  className={`p-8 rounded-3xl border transition-all cursor-default group ${viviremosVis ? 'anim-reveal' : 'opacity-0'} ${isDark ? eje.bgDark + ' border-transparent' : 'bg-gradient-to-br shadow-sm hover:shadow-xl ' + eje.bg + ' ' + eje.border}`}
                  style={{ animationDelay: `${0.1 + i * 0.12}s` }}
                >

                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-800 shadow-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
                    <eje.icon size={28} style={{ color: eje.acento }} />
                  </div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">{eje.titulo}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{eje.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Call to Action: Proponer */}
      <section className="py-24 bg-[#F5F4F0] dark:bg-[#071410]" ref={ctaRef}>
        <div className={`max-w-4xl mx-auto px-4 text-center ${ctaVis ? 'anim-reveal' : 'opacity-0'}`}>
          <div className="bg-[#05140B] rounded-[3rem] p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Rocket size={200} className="text-white" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4">¿Aún no envías tu propuesta?</h2>
            <p className="text-white/60 mb-10 max-w-md mx-auto">La convocatoria sigue abierta para ponentes y colaboradores. Comparte tu conocimiento con la comunidad.</p>
            <Link to="/proponer" className="inline-flex items-center gap-2 bg-amber-400 text-[#05140B] px-8 py-4 rounded-2xl font-black uppercase text-sm hover:scale-105 transition-all">
              Enviar Propuesta <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}

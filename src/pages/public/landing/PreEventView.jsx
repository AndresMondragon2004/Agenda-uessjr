import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  ArrowRight, CalendarDays, MapPin, 
  Terminal, Leaf, Calculator, Users,
  Rocket, BookOpen, Mic2, Star
} from 'lucide-react'
import { parseSafeDate } from '../../../utils/dateHelper'

/* ─── Ejes Académicos (Reutilizados) ─── */
const EJES = [
  {
    icon: Terminal, titulo: 'Ingeniería en sistemas',
    desc: 'IA, Ciberseguridad y Desarrollo.',
    programa: 'sistemas', acento: '#D97706',
    bg: 'from-amber-50 to-orange-50', bgDark: 'dark:from-amber-950/60 dark:to-orange-950/40',
  },
  {
    icon: Leaf, titulo: 'Innovación agrícola',
    desc: 'Sustentabilidad y Biotecnología.',
    programa: 'innovacion_agricola', acento: '#16A34A',
    bg: 'from-green-50 to-emerald-50', bgDark: 'dark:from-green-950/60 dark:to-emerald-950/40',
  },
  {
    icon: Calculator, titulo: 'Licenciatura en contaduría',
    desc: 'Finanzas y Gestión Empresarial.',
    programa: 'contaduria', acento: '#2563EB',
    bg: 'from-blue-50 to-indigo-50', bgDark: 'dark:from-blue-950/60 dark:to-indigo-950/40',
  },
  {
    icon: Users, titulo: 'Público en general',
    desc: 'Cultura, Arte y Comunidad.',
    programa: 'publico_general', acento: '#7C3AED',
    bg: 'from-violet-50 to-purple-50', bgDark: 'dark:from-violet-950/60 dark:to-purple-950/40',
  },
]

/* ─── Subcomponente: Countdown Big ─── */
function LargeCountdown({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 })

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = parseSafeDate(targetDate) - new Date()
      if (diff > 0) {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / 1000 / 60) % 60),
          s: Math.floor((diff / 1000) % 60)
        })
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-6 max-w-2xl mx-auto">
      {[
        { label: 'Días', val: timeLeft.d },
        { label: 'Horas', val: timeLeft.h },
        { label: 'Minutos', val: timeLeft.m },
        { label: 'Segundos', val: timeLeft.s }
      ].map((item, i) => (
        <div key={i} className="flex flex-col items-center group">
          <div className="w-full aspect-square bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-[2rem] border border-white/20 flex items-center justify-center shadow-2xl transition-transform group-hover:-translate-y-2">
            <span className="text-3xl sm:text-5xl font-black text-white font-mono">{String(item.val).padStart(2, '0')}</span>
          </div>
          <span className="text-[10px] sm:text-xs font-black text-amber-400 uppercase tracking-[0.2em] mt-3 sm:mt-4">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function PreEventView({ jornada }) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0D2B1D] selection:bg-amber-400 selection:text-[#0D2B1D]">
      
      {/* 1. Hero Section: Countdown focus */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background image with higher opacity for Pre-Event */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/campus/aula-magna-1.jpg" 
            className="w-full h-full object-cover opacity-30 mix-blend-overlay"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0D2B1D]/80 via-[#0D2B1D]/40 to-[#0D2B1D]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-400 text-[#0D2B1D] px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest mb-8 anim-fade-up">
            <Rocket size={14} /> Próximamente
          </div>
          
          <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black text-white tracking-tight mb-6 anim-fade-up anim-delay-100">
            Estamos <span className="text-amber-300">preparando</span> algo histórico
          </h1>
          
          <p className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto mb-16 anim-fade-up anim-delay-200 leading-relaxed">
            La 12va Jornada Académica y Cultural de la UES San José del Rincón está por comenzar. Únete a la mayor celebración del conocimiento.
          </p>

          <div className="anim-scale-in anim-delay-300">
            <LargeCountdown targetDate={jornada?.fecha_inicio ? `${jornada.fecha_inicio}T09:00:00` : '2026-05-11T09:00:00'} />
          </div>

          <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 anim-fade-up anim-delay-400">
            <Link to="/agenda" className="w-full sm:w-auto bg-white text-[#0D2B1D] px-10 py-5 rounded-2xl font-black uppercase text-sm hover:bg-amber-300 transition-all shadow-xl hover:-translate-y-1">
              Ver Programa Preliminar
            </Link>
            <Link to="/registro" className="w-full sm:w-auto border-2 border-white/20 text-white px-10 py-5 rounded-2xl font-black uppercase text-sm hover:bg-white/10 transition-all backdrop-blur-md">
              Registrarme ahora
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Qué esperar (Stats Teaser) */}
      <section className="bg-white dark:bg-[#0A1A11] py-24 rounded-t-[3rem] -mt-10 relative z-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            <div className="lg:col-span-1">
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white leading-tight mb-6">
                Lo que <span className="text-[#1B4332] dark:text-emerald-500">viviremos</span> en esta edición
              </h2>
              <div className="space-y-6">
                {[
                  { icon: BookOpen, text: 'Talleres prácticos de alta tecnología' },
                  { icon: Mic2, text: 'Conferencistas nacionales e internacionales' },
                  { icon: Star, text: 'Presentaciones culturales de primer nivel' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 text-gray-600 dark:text-gray-400 font-bold">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-[#1B4332] dark:text-emerald-400">
                      <item.icon size={20} />
                    </div>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {EJES.map((eje, i) => (
                <div key={i} className={`p-8 rounded-3xl bg-gradient-to-br ${eje.bg} ${eje.bgDark} border border-transparent hover:border-gray-200 transition-all cursor-default group`}>
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
      <section className="py-24 bg-[#F0F7F4] dark:bg-[#071410]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-[#0D2B1D] rounded-[3rem] p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Rocket size={200} className="text-white" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4">¿Aún no envías tu propuesta?</h2>
            <p className="text-white/60 mb-10 max-w-md mx-auto">La convocatoria sigue abierta para ponentes y colaboradores. Comparte tu conocimiento con la comunidad.</p>
            <Link to="/proponer" className="inline-flex items-center gap-2 bg-amber-400 text-[#0D2B1D] px-8 py-4 rounded-2xl font-black uppercase text-sm hover:scale-105 transition-all">
              Enviar Propuesta <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}

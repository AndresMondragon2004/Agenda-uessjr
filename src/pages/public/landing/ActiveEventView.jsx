import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, Megaphone, Terminal, Leaf,
  Calculator, Users, CalendarDays, Mic2,
  Clock, MapPin, BookOpen, ChevronRight,
} from 'lucide-react'
import { sesionesService } from '../../../services/sesiones.service'
import { parseSafeDate } from '../../../utils/dateHelper'

/* ─── CSS de animaciones ─────────────────────────────────────────────────── */
const ANIM_CSS = `
  @keyframes fadeUp    { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
  @keyframes scaleIn   { from { opacity:0; transform:scale(.93)       } to { opacity:1; transform:scale(1)     } }
  @keyframes floatSlow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
  @keyframes floatMed  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes shimmer   { from{background-position:200% 0} to{background-position:-200% 0} }

  .anim-fade-up   { animation: fadeUp  .6s ease both }
  .anim-scale-in  { animation: scaleIn .6s ease both }
  .anim-float-slow{ animation: floatSlow 7s ease-in-out infinite }
  .anim-float     { animation: floatMed  5s ease-in-out infinite }
  .anim-delay-100 { animation-delay:.10s }
  .anim-delay-200 { animation-delay:.20s }
  .anim-delay-300 { animation-delay:.30s }
  .anim-delay-400 { animation-delay:.40s }
  .anim-delay-800 { animation-delay:.80s }
  .shimmer-bg {
    background: linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);
    background-size: 400% 100%;
    animation: shimmer 1.5s infinite;
  }
  html.dark .shimmer-bg {
    background: linear-gradient(90deg,#122A1C 25%,#1A3425 50%,#122A1C 75%);
    background-size: 400% 100%;
  }
`

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

/* ─── Intersection Observer ──────────────────────────────────────────────── */
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

/* ─── Wave divider ────────────────────────────────────────────────────────── */
function WaveDivider({ fromColor, toColor }) {
  return (
    <div style={{ background: fromColor, marginBottom: -2 }}>
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none"
           style={{ display: 'block', width: '100%', height: 60 }}>
        <path d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z"
              fill={toColor} />
      </svg>
    </div>
  )
}

/* ─── Ejes ────────────────────────────────────────────────────────────────── */
const EJES = [
  {
    icon: Terminal, titulo: 'Ingeniería en sistemas',
    desc: 'Ciberseguridad, inteligencia artificial y desarrollo web.',
    programa: 'sistemas', acento: '#D97706',
    bg: 'from-amber-50 to-orange-50', bgDark: 'dark:from-amber-950/60 dark:to-orange-950/40',
  },
  {
    icon: Leaf, titulo: 'Innovación agrícola',
    desc: 'Biotecnología, sustentabilidad y tecnología de campo.',
    programa: 'innovacion_agricola', acento: '#16A34A',
    bg: 'from-green-50 to-emerald-50', bgDark: 'dark:from-green-950/60 dark:to-emerald-950/40',
  },
  {
    icon: Calculator, titulo: 'Licenciatura en contaduría',
    desc: 'Finanzas, auditoría y gestión empresarial moderna.',
    programa: 'contaduria', acento: '#2563EB',
    bg: 'from-blue-50 to-indigo-50', bgDark: 'dark:from-blue-950/60 dark:to-indigo-950/40',
  },
  {
    icon: Users, titulo: 'Público en general',
    desc: 'Cultura, arte y conocimiento para toda la comunidad.',
    programa: 'publico_general', acento: '#7C3AED',
    bg: 'from-violet-50 to-purple-50', bgDark: 'dark:from-violet-950/60 dark:to-purple-950/40',
  },
]

/* ─── Stat card ───────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, value, label, color, delay }) {
  return (
    <div
      className="flex flex-col items-center gap-2 p-6 bg-white dark:bg-[#122A1C] rounded-2xl shadow-sm border border-gray-100 dark:border-emerald-900/40 anim-scale-in"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-1"
           style={{ background: `${color}18` }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <span className="text-3xl font-black text-gray-900 dark:text-gray-100 leading-none">{value}</span>
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center leading-tight">{label}</span>
    </div>
  )
}

/* ─── Session card ────────────────────────────────────────────────────────── */
function SessionCard({ ses, idx, inView }) {
  const ACCENTS = ['#1B4332', '#D97706', '#2563EB']
  const accent  = ACCENTS[idx % ACCENTS.length]
  return (
    <div
      className={`group bg-white dark:bg-[#122A1C] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col border border-gray-100 dark:border-emerald-900/40 anim-fade-up ${inView ? '' : 'opacity-0'}`}
      style={{ animationDelay: `${0.1 + idx * 0.12}s` }}
    >
      <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg,${accent},${accent}88)` }} />
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
            Conferencia
          </span>
          <div className="text-right shrink-0 ml-2">
            <p className="font-bold text-base" style={{ color: accent }}>
              {ses.hora_inicio?.slice(0, 5)}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">
                {ses.dias_jornada?.fecha && parseSafeDate(ses.dias_jornada.fecha, '12:00:00')
                  ? parseSafeDate(ses.dias_jornada.fecha, '12:00:00')
                    .toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
                    .toUpperCase()
                  : ''}
            </p>
          </div>
        </div>
        <span className="text-gray-100 dark:text-[#1A3425] font-black text-5xl leading-none select-none -mt-1 mb-2">
          0{idx + 1}
        </span>
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4 leading-snug line-clamp-3 flex-grow group-hover:text-[#1B4332] dark:group-hover:text-emerald-400 transition-colors">
          {ses.nombre}
        </h3>
        {ses.ponente_nombre && (
          <div className="flex items-center gap-3 mb-3">
            {ses.ponente_foto_url ? (
              <img src={ses.ponente_foto_url} alt={ses.ponente_nombre}
                   className="w-8 h-8 rounded-full object-cover border-2 border-gray-100 dark:border-emerald-900/50 shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                   style={{ background: `${accent}18` }}>
                <span className="font-bold text-xs" style={{ color: accent }}>
                  {ses.ponente_nombre.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-gray-700 dark:text-gray-300 text-sm font-semibold truncate">
                {ses.ponente_grado} {ses.ponente_nombre}
              </p>
              {ses.ponente_institucion && (
                <p className="text-gray-400 dark:text-gray-500 text-xs truncate">{ses.ponente_institucion}</p>
              )}
            </div>
          </div>
        )}
        {ses.escenarios?.nombre && (
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs">
            <MapPin size={11} className="shrink-0" />
            <span>{ses.escenarios.nombre}</span>
          </div>
        )}
      </div>
      <div className="px-6 pb-6">
        <Link
          to={`/agenda/${ses.id}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                     text-sm font-bold transition-all border hover:text-white"
          style={{ color: accent, borderColor: `${accent}40` }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = accent
            e.currentTarget.style.borderColor     = accent
            e.currentTarget.style.color           = 'white'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.borderColor     = `${accent}40`
            e.currentTarget.style.color           = accent
          }}
        >
          Ver detalles <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  )
}

/* ─── Countdown Timer ─────────────────────────────────────────────────────── */
function CountdownTimer({ targetDate, endDate }) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 })

  useEffect(() => {
    if (!targetDate) return

    const calculateTimeLeft = () => {
      const difference = parseSafeDate(targetDate) - new Date()
      if (difference > 0) {
        setTimeLeft({
          d: Math.floor(difference / (1000 * 60 * 60 * 24)),
          h: Math.floor((difference / (1000 * 60 * 60)) % 24),
          m: Math.floor((difference / 1000 / 60) % 60),
          s: Math.floor((difference / 1000) % 60)
        })
      } else {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  if (!targetDate) return null

  const now = new Date()
  const started = parseSafeDate(targetDate) <= now
  const ended   = endDate ? parseSafeDate(endDate) < now : started

  if (started) {
    if (!ended) {
      return (
        <div className="mt-6 anim-fade-up anim-delay-400">
          <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-white font-bold text-sm">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            Jornada en curso
          </span>
        </div>
      )
    }
    return (
      <div className="mt-6 anim-fade-up anim-delay-400">
        <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-white font-bold text-sm">
          <span>🎓</span> Jornada finalizada
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 mt-6 anim-fade-up anim-delay-400">
      {[
        { label: 'Días', val: timeLeft.d },
        { label: 'Hrs', val: timeLeft.h },
        { label: 'Min', val: timeLeft.m },
        { label: 'Seg', val: timeLeft.s }
      ].map((item, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center mb-1.5 shadow-lg">
            <span className="text-xl font-black text-white font-mono">{String(item.val).padStart(2, '0')}</span>
          </div>
          <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

/* ─── ActiveEventView ─────────────────────────────────────────────────────────────── */
export default function ActiveEventView({ jornada }) {
  const navigate = useNavigate()
  const isDark   = useDarkMode()

  const [sesionesDestacadas, setSesionesDestacadas] = useState([])
  const [proximaSesion,      setProximaSesion]      = useState(null)
  const [stats,              setStats]              = useState({ sesiones: 0, conferencistas: 0, dias: 0 })
  const [loadingData,        setLoadingData]        = useState(true)
  const [imgLoaded,          setImgLoaded]          = useState(false)

  const [statsRef, statsVis] = useInView()
  const [ejesRef,  ejesVis]  = useInView()
  const [sesRef,   sesVis]   = useInView()
  const [ctaRef,   ctaVis]   = useInView()

  useEffect(() => {
    async function cargar() {
      try {
        if (!jornada) return
        const ses    = await sesionesService.getByJornada(jornada.id)
        const activas = (ses || []).filter(s => s.estado === 'activa')
        setSesionesDestacadas(activas.filter(s => s.tipo === 'conferencia').slice(0, 3))
        const confs = new Set(activas.filter(s => s.ponente_nombre).map(s => s.ponente_nombre.toLowerCase().trim())).size
        setStats({ sesiones: activas.length, conferencistas: confs, dias: (jornada.dias_jornada || []).length })

        const ahora = new Date()
        const pad = (n) => n.toString().padStart(2, '0')
        const hoy = `${ahora.getFullYear()}-${pad(ahora.getMonth()+1)}-${pad(ahora.getDate())}`
        const hora = `${pad(ahora.getHours())}:${pad(ahora.getMinutes())}`

        const enCurso = activas.find(s =>
          s.dias_jornada?.fecha === hoy &&
          s.hora_inicio?.slice(0,5) <= hora &&
          s.hora_fin?.slice(0,5) >= hora
        )

        const proximas = activas.filter(s => {
          if (!s.dias_jornada?.fecha || !s.hora_inicio) return false
          if (s.dias_jornada.fecha > hoy) return true
          if (s.dias_jornada.fecha === hoy && s.hora_inicio.slice(0,5) > hora) return true
          return false
        }).sort((a, b) => {
          const dtA = `${a.dias_jornada.fecha}T${a.hora_inicio}`
          const dtB = `${b.dias_jornada.fecha}T${b.hora_inicio}`
          return dtA.localeCompare(dtB)
        })

        setProximaSesion(enCurso || proximas[0] || activas[activas.length - 1] || activas[0] || null)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingData(false)
      }
    }
    cargar()
  }, [jornada])

  /* Colores de wave según el modo */
  const W = isDark
    ? { hero: '#0D2B1D', stats: '#0A1A11', ejes: '#0E1F15', ses: '#0A1A11', id: '#0D2B1D' }
    : { hero: '#0D2B1D', stats: '#F0F7F4', ejes: '#FFFFFF',  ses: '#F8FAFB', id: '#0D2B1D' }

  return (
    <div className="w-full">
      <style>{ANIM_CSS}</style>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] overflow-hidden flex items-center">

        <img
          src="/images/campus/aula-magna-1.jpg"
          alt=""
          aria-hidden="true"
          onLoad={() => setImgLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        />

        <div className={`absolute inset-0 bg-[#0D2B1D] transition-opacity duration-700 ${imgLoaded ? 'opacity-0' : 'opacity-100'}`} />

        {/* Gradiente escritorio: izquierda oscura, derecha translúcida */}
        <div className="absolute inset-0 hidden sm:block"
             style={{ background: 'linear-gradient(to right, rgba(13,43,29,0.97) 0%, rgba(13,43,29,0.92) 45%, rgba(13,43,29,0.65) 65%, rgba(13,43,29,0.30) 100%)' }} />
        {/* Gradiente móvil: arriba-abajo con menor opacidad para que la imagen se vea */}
        <div className="absolute inset-0 sm:hidden"
             style={{ background: 'linear-gradient(to bottom, rgba(13,43,29,0.82) 0%, rgba(13,43,29,0.68) 55%, rgba(13,43,29,0.88) 100%)' }} />

        <div className="absolute bottom-0 left-0 right-0 h-32"
             style={{ background: 'linear-gradient(to top, rgba(13,43,29,0.5), transparent)' }} />

        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Columna izquierda */}
            <div className="flex flex-col gap-6">

              <div className="flex items-center gap-3 self-start anim-fade-up">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                </span>
                <span className="bg-white/10 border border-white/20 text-white/90 font-black text-[10px] px-4 py-1.5 rounded-xl uppercase tracking-widest backdrop-blur-sm">
                  {jornada
                    ? new Date(jornada.fecha_inicio + 'T12:00:00')
                        .toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
                        .toUpperCase()
                    : 'MAYO 2026'}
                </span>
              </div>

              <div className="anim-fade-up anim-delay-100">
                <h1 className="font-black leading-[1.05] tracking-tight">
                  <span className="block text-white text-4xl sm:text-5xl lg:text-7xl drop-shadow-lg">
                    {jornada ? jornada.edicion : '12va'} jornada
                  </span>
                  <span className="block text-amber-300 text-3xl sm:text-4xl lg:text-5xl mt-2 drop-shadow-lg">
                    académica y cultural
                  </span>
                </h1>
              </div>

              <p className="text-white/75 text-lg leading-relaxed max-w-lg border-l-4 border-amber-400/50 pl-4 anim-fade-up anim-delay-200">
                {jornada?.lema || 'Cultura que inspira, conocimiento que transforma. Únete al evento académico más importante del año.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 anim-fade-up anim-delay-300 mt-2">
                <Link
                  to="/agenda"
                  className="inline-flex items-center justify-center gap-2 bg-[#D97706] hover:bg-amber-500 text-white font-black text-sm px-8 py-4 rounded-2xl transition-all shadow-lg shadow-amber-900/30 hover:-translate-y-0.5 uppercase tracking-wide"
                >
                  Explorar agenda <ArrowRight size={18} />
                </Link>
                <Link
                  to="/proponer"
                  className="inline-flex items-center justify-center gap-2 border-2 border-white/30 hover:border-white/60 text-white font-bold text-sm px-8 py-4 rounded-2xl hover:bg-white/10 transition-all backdrop-blur-sm"
                >
                  Proponer actividad
                </Link>
              </div>

              <div className="flex items-center gap-3 text-white/50 text-sm font-medium anim-fade-up anim-delay-400 mt-2">
                <div className="h-px w-8 bg-white/30" />
                <CalendarDays size={15} className="text-amber-400 shrink-0" />
                <span>
                  {jornada
                    ? `${new Date(jornada.fecha_inicio + 'T12:00:00').toLocaleDateString('es-MX',{day:'numeric'})} — ${new Date(jornada.fecha_fin + 'T12:00:00').toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'})} · ${jornada.sede}`
                    : '11 — 15 de mayo de 2026 · UES San José del Rincón'}
                </span>
              </div>
              
              <CountdownTimer
                targetDate={jornada?.fecha_inicio ? `${jornada.fecha_inicio}T09:00:00` : '2026-05-11T09:00:00'}
                endDate={jornada?.fecha_fin ? `${jornada.fecha_fin}T23:59:59` : '2026-05-15T23:59:59'}
              />

              {/* Logos Institucionales en Hero */}
              <div className="flex items-center gap-6 pt-8 anim-fade-up anim-delay-800 border-t border-white/10 mt-4">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] [writing-mode:vertical-lr] rotate-180">
                  Respaldado por
                </p>
                <div className="flex items-center gap-6">
                  <img src="https://sic.cultura.gob.mx/imagenes_cache/universidad_4260_g_74199.png" alt="UMB" className="h-10 sm:h-12 object-contain opacity-60 hover:opacity-100 transition-opacity drop-shadow-lg" />
                  <img src="/images/logos/ues-sjr.png" alt="UES SJR" className="h-10 sm:h-12 object-contain brightness-0 invert opacity-60 hover:opacity-100 transition-opacity drop-shadow-lg" />
                </div>
              </div>
            </div>

            {/* Card sesión compacta — solo móvil/tablet */}
            {proximaSesion && (
              <div className="lg:hidden anim-fade-up anim-delay-400">
                <Link
                  to={`/agenda/${proximaSesion.id}`}
                  className="flex items-center gap-4 rounded-2xl px-5 py-4 border border-white/20"
                  style={{ background: 'rgba(13,43,29,0.55)', backdropFilter: 'blur(16px)' }}
                >
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-0.5">
                      {(() => {
                        const ahora = new Date()
                        const pad = n => n.toString().padStart(2,'0')
                        const hoy  = `${ahora.getFullYear()}-${pad(ahora.getMonth()+1)}-${pad(ahora.getDate())}`
                        const hora = `${pad(ahora.getHours())}:${pad(ahora.getMinutes())}`
                        return proximaSesion.dias_jornada?.fecha === hoy &&
                               proximaSesion.hora_inicio?.slice(0,5) <= hora &&
                               proximaSesion.hora_fin?.slice(0,5) >= hora
                          ? 'En curso' : 'Próxima sesión'
                      })()}
                    </p>
                    <p className="text-white font-bold text-sm truncate">{proximaSesion.nombre}</p>
                    {proximaSesion.hora_inicio && (
                      <p className="text-white/50 text-xs mt-0.5">
                        {proximaSesion.hora_inicio.slice(0,5)} — {proximaSesion.hora_fin?.slice(0,5)}
                        {proximaSesion.escenarios?.nombre && ` · ${proximaSesion.escenarios.nombre}`}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-white/40 shrink-0" />
                </Link>
              </div>
            )}

            {/* Columna derecha — card próxima sesión */}
            {proximaSesion && (
              <div className="hidden lg:flex justify-end anim-scale-in anim-delay-400">
                <div className="relative rounded-3xl p-8 max-w-sm w-full shadow-2xl shadow-black/30 group hover:-translate-y-1 transition-transform duration-300 border border-white/20"
                     style={{ background: 'rgba(13,43,29,0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>

                  <div className="absolute top-0 left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full" />

                  <div className="flex items-center gap-3 mb-5">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                    </span>
                    <span className="text-white/70 font-black uppercase text-[10px] tracking-widest">
                      {(() => {
                        const ahora = new Date()
                        const pad = (n) => n.toString().padStart(2, '0')
                        const hoy = `${ahora.getFullYear()}-${pad(ahora.getMonth()+1)}-${pad(ahora.getDate())}`
                        const hora = `${pad(ahora.getHours())}:${pad(ahora.getMinutes())}`
                        return proximaSesion.dias_jornada?.fecha === hoy &&
                               proximaSesion.hora_inicio?.slice(0,5) <= hora &&
                               proximaSesion.hora_fin?.slice(0,5) >= hora
                          ? 'Sesión en curso'
                          : 'Próxima sesión'
                      })()}
                    </span>
                  </div>

                  <h2 className="text-xl font-black text-white mb-4 leading-snug line-clamp-2 group-hover:text-amber-200 transition-colors">
                    {proximaSesion.nombre}
                  </h2>

                  {proximaSesion.hora_inicio && (
                    <div className="flex items-center gap-2 mb-5 flex-wrap">
                      <span className="px-3 py-1.5 bg-white/15 text-white rounded-xl text-xs font-black border border-white/20 shrink-0">
                        {proximaSesion.hora_inicio.slice(0,5)} — {proximaSesion.hora_fin?.slice(0,5)}
                      </span>
                      {proximaSesion.escenarios?.nombre && (
                        <>
                          <span className="text-white/30">·</span>
                          <MapPin size={12} className="shrink-0 text-amber-400" />
                          <span className="text-white/70 text-xs font-bold truncate">
                            {proximaSesion.escenarios.nombre}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {proximaSesion.ponente_nombre && (
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl mb-5 border border-white/15"
                         style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="w-9 h-9 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                        <span className="text-amber-300 font-black text-sm">
                          {proximaSesion.ponente_nombre.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-bold text-sm leading-tight truncate">
                          {proximaSesion.ponente_grado} {proximaSesion.ponente_nombre}
                        </p>
                        {proximaSesion.ponente_institucion && (
                          <p className="text-white/50 text-xs truncate mt-0.5">
                            {proximaSesion.ponente_institucion}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <Link
                    to={`/agenda/${proximaSesion.id}`}
                    className="flex items-center justify-center gap-2 w-full border border-white/25 text-white/80 text-sm font-bold uppercase tracking-wide rounded-xl px-4 py-3 hover:bg-white/15 hover:text-white hover:border-white/40 transition-all"
                  >
                    Ver detalles <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="hidden sm:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 opacity-40 anim-fade-up anim-delay-800">
          <div className="w-0.5 h-8 bg-white animate-pulse rounded-full" />
          <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">Desplaza</span>
        </div>
      </section>

      <WaveDivider fromColor={W.hero} toColor={W.stats} />

      {/* ══════════════════════════════════════════
          STATS
      ══════════════════════════════════════════ */}
      <section className="bg-[#F0F7F4] dark:bg-[#0A1A11] py-14" ref={statsRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-10 ${statsVis ? 'anim-fade-up' : 'opacity-0'}`}>
            <span className="text-[#1B4332]/60 dark:text-emerald-700 font-bold text-xs uppercase tracking-[0.2em]">
              UES San José del Rincón
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#1B4332] dark:text-emerald-400 mt-1">
              Una jornada, múltiples experiencias
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statsVis && (
              <>
                <StatCard icon={BookOpen}     value={stats.sesiones      > 0 ? `${stats.sesiones}+`      : '—'} label="Sesiones académicas"  color="#1B4332" delay={0.05} />
                <StatCard icon={Mic2}         value={stats.conferencistas > 0 ? `${stats.conferencistas}+` : '—'} label="Conferencistas"        color="#D97706" delay={0.15} />
                <StatCard icon={CalendarDays} value={stats.dias           > 0 ? `${stats.dias}`            : '—'} label="Días de actividades"   color="#2563EB" delay={0.25} />
                <StatCard icon={Users}        value="4"                                                           label="Programas académicos"  color="#7C3AED" delay={0.35} />
              </>
            )}
          </div>
        </div>
      </section>

      <WaveDivider fromColor={W.stats} toColor={W.ejes} />

      {/* ══════════════════════════════════════════
          EJES ACADÉMICOS
      ══════════════════════════════════════════ */}
      <section className="bg-white dark:bg-[#0E1F15] py-24" ref={ejesRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-14 ${ejesVis ? 'anim-fade-up' : 'opacity-0'}`}>
            <div>
              <span className="inline-flex items-center gap-2 text-[#1B4332]/60 dark:text-emerald-600 font-bold text-xs uppercase tracking-[0.15em] mb-3">
                <span className="w-6 h-px bg-[#1B4332]/40 dark:bg-emerald-800" />
                Ejes temáticos
              </span>
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight">
                Filtra por tu <span className="text-[#1B4332] dark:text-emerald-400">área académica</span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-base">
                Haz clic en tu carrera para ver las sesiones que te interesan.
              </p>
            </div>
            <Link to="/agenda" className="text-[#1B4332] dark:text-emerald-400 font-semibold text-sm hover:underline flex items-center gap-1 shrink-0">
              Ver agenda completa <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {EJES.map(({ icon: Icon, titulo, desc, programa, acento, bg, bgDark }, i) => (
              <button
                key={programa}
                onClick={() => navigate(`/agenda?programa=${programa}`)}
                className={`group relative text-left bg-gradient-to-br ${bg} ${bgDark} p-6 rounded-2xl border-2 border-transparent hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer ${ejesVis ? 'anim-fade-up' : 'opacity-0'}`}
                style={{ animationDelay: `${0.1 + i * 0.08}s` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${acento}30` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent' }}
              >
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl opacity-40 group-hover:opacity-100 transition-opacity"
                     style={{ background: acento }} />
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                     style={{ background: `${acento}18` }}>
                  <Icon className="w-6 h-6" style={{ color: acento }} />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2 leading-snug">{titulo}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-4">{desc}</p>
                <div className="flex items-center gap-1 text-xs font-bold transition-colors" style={{ color: acento }}>
                  Ver sesiones <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider fromColor={W.ejes} toColor={W.ses} />

      {/* ══════════════════════════════════════════
          SESIONES DESTACADAS
      ══════════════════════════════════════════ */}
      <section className="bg-[#F8FAFB] dark:bg-[#0A1A11] py-24" ref={sesRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14 ${sesVis ? 'anim-fade-up' : 'opacity-0'}`}>
            <div>
              <span className="text-[#1B4332]/50 dark:text-emerald-800 font-bold text-xs uppercase tracking-[0.15em] mb-2 block">
                Programa {jornada ? new Date(jornada.fecha_inicio + 'T12:00:00').getFullYear() : '2026'}
              </span>
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight">
                Sesiones <span className="text-[#1B4332] dark:text-emerald-400">destacadas</span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">No te pierdas los eventos más esperados de la jornada.</p>
            </div>
            <Link to="/agenda" className="text-[#D97706] dark:text-amber-400 font-semibold text-sm hover:underline flex items-center gap-1 shrink-0">
              Ver agenda completa <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingData ? (
              [1,2,3].map(i => (
                <div key={i} className="bg-white dark:bg-[#122A1C] rounded-2xl h-72 shimmer-bg border border-gray-100 dark:border-emerald-900/40" />
              ))
            ) : sesionesDestacadas.length > 0 ? (
              sesionesDestacadas.map((ses, idx) => (
                <SessionCard key={ses.id} ses={ses} idx={idx} inView={sesVis} />
              ))
            ) : (
              <div className="col-span-3 text-center py-16">
                <div className="w-20 h-20 bg-gray-100 dark:bg-[#122A1C] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarDays className="w-10 h-10 text-gray-300 dark:text-emerald-900" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Las sesiones se publicarán próximamente.</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Vuelve pronto para ver el programa completo.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <WaveDivider fromColor={W.ses} toColor={W.id} />

      {/* ══════════════════════════════════════════
          IDENTIDAD LOCAL
      ══════════════════════════════════════════ */}
      <section className="bg-[#0D2B1D] dark:bg-[#071410] py-16 relative overflow-hidden" ref={ctaRef}>
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-8 left-12 w-32 h-32 border border-emerald-700/30 rounded-full" />
          <div className="absolute top-4 left-8 w-48 h-48 border border-emerald-700/15 rounded-full" />
          <div className="absolute bottom-8 right-12 w-40 h-40 border border-amber-700/20 rounded-full" />
          <div className="absolute bottom-4 right-8 w-56 h-56 border border-amber-700/10 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-900/20 rounded-full blur-3xl" />
        </div>
        <div className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center ${ctaVis ? 'anim-fade-up' : 'opacity-0'}`}>
          <div className="w-14 h-14 bg-amber-400/20 border border-amber-400/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-7 h-7 text-amber-400" />
          </div>
          <p className="text-amber-300/80 text-xs uppercase tracking-[0.2em] font-bold mb-3">
            San José del Rincón · Estado de México
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
            UES San José del Rincón
          </h2>
          <p className="text-white/55 max-w-xl mx-auto text-base leading-relaxed">
            La jornada académica conecta saberes, culturas y comunidades para construir un futuro de conocimiento compartido.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BANNER PARTICIPACIÓN
      ══════════════════════════════════════════ */}
      <section className="bg-[#F0F7F4] dark:bg-[#0A1A11] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#1B4332] to-[#0D2B1D] rounded-3xl p-8 sm:p-12 md:p-14 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-64 pointer-events-none overflow-hidden rounded-r-3xl hidden lg:block">
              <div className="absolute right-8 top-8 w-32 h-32 border-2 border-white/5 rounded-full" />
              <div className="absolute right-4 top-4 w-48 h-48 border border-white/5 rounded-full" />
              <div className="absolute right-16 bottom-8 w-20 h-20 bg-amber-400/8 rounded-full blur-xl" />
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-amber-400/20 border border-amber-400/30 rounded-2xl flex items-center justify-center shrink-0">
                  <Megaphone className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-3xl font-bold text-white mb-2">¿Tienes algo que compartir?</h2>
                  <p className="text-white/65 text-base max-w-md">Propón un taller, conferencia o actividad cultural. Queremos escucharte.</p>
                </div>
              </div>
              <Link
                to="/proponer"
                className="w-full sm:w-auto shrink-0 bg-[#D97706] hover:bg-amber-500 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-amber-900/30 hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                Enviar propuesta <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

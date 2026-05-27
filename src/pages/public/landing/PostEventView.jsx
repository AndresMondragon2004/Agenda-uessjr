import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Users, Calendar, ChevronRight, Award, Star, MapPin, Clock, ArrowRight } from 'lucide-react'
import { sesionesService } from '../../../services/sesiones.service'
import { supabase } from '../../../services/supabase'

/* ─── CSS de animaciones (Unificado con ActiveEventView) ─────────────────── */
const ANIM_CSS = `
  @keyframes fadeUp    { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
  @keyframes scaleIn   { from { opacity:0; transform:scale(.93)       } to { opacity:1; transform:scale(1)     } }
  @keyframes floatSlow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
  @keyframes floatMed  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes shimmer   { from{background-position:200% 0} to{background-position:-200% 0} }

  .anim-fade-up   { animation: fadeUp  .6s ease both }
  .anim-scale-in  { animation: scaleIn .6s ease both }
  .anim-delay-100 { animation-delay:.10s }
  .anim-delay-200 { animation-delay:.20s }
  .anim-delay-300 { animation-delay:.30s }
  .anim-delay-400 { animation-delay:.40s }
  .anim-delay-800 { animation-delay:.80s }
`

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

export default function PostEventView({ jornada }) {
  const [topSesiones, setTopSesiones] = useState([])
  const [stats, setStats] = useState({ totalParticipantes: 0, totalSesiones: 0 })
  const [loading, setLoading] = useState(true)

  const [statsRef,  statsVis]  = useInView()
  const [fameRef,   fameVis]   = useInView()
  const [cierreRef, cierreVis] = useInView()

  useEffect(() => {
    async function cargarResumen() {
      try {
        if (!jornada) return
        const ses = await sesionesService.getByJornada(jornada.id)
        const activas = (ses || []).filter(s => s.estado === 'activa')
        
        // Calcular participantes ÚNICOS (Alumnos reales)
        const sesionIds = activas.map(s => s.id)
        let alumnosUnicos = 0

        if (sesionIds.length > 0) {
          const { data: inscData, error: inscError } = await supabase
            .from('inscripciones')
            .select('estudiante_id')
            .in('sesion_id', sesionIds)
            .eq('estado', 'confirmada')
          
          if (inscError) throw inscError
          alumnosUnicos = new Set((inscData || []).map(i => i.estudiante_id)).size
        }

        setStats({ 
          totalParticipantes: alumnosUnicos, 
          totalSesiones: activas.length 
        })

        // Top 3 sesiones
        const sorted = [...activas].sort((a, b) => (b.total_inscritos || 0) - (a.total_inscritos || 0))
        setTopSesiones(sorted.slice(0, 3))
      } catch (err) {
        console.error('Error al cargar resumen post-evento:', err)
      } finally {
        setLoading(false)
      }
    }
    cargarResumen()
  }, [jornada])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A1A11]">
      <style>{ANIM_CSS}</style>
      
      {/* 1. Hero: Agradecimiento */}
      <section className="relative pt-32 pb-20 bg-[#0D2B1D] overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src="/images/campus/aula-magna-1.jpg" className="w-full h-full object-cover" alt="" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D2B1D]/90 to-[#0D2B1D]" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-amber-400/20 border border-amber-400/30 rounded-full flex items-center justify-center mx-auto mb-8 anim-scale-in">
            <Trophy className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white mb-6 tracking-tight anim-fade-up">
            ¡Misión <span className="text-amber-300">Cumplida!</span>
          </h1>
          <p className="text-white/70 text-xl max-w-2xl mx-auto mb-10 anim-fade-up anim-delay-100">
            La {jornada?.edicion || '12va'} Jornada Académica y Cultural ha finalizado con éxito rotundo. Gracias por ser parte de esta experiencia transformadora.
          </p>
          <div className="flex justify-center gap-4 anim-fade-up anim-delay-200">
            <Link to="/agenda" className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-3 rounded-xl font-bold transition-all backdrop-blur-md flex items-center gap-2">
              Explorar Archivo Histórico <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Stats Dashboard */}
      <section className="max-w-7xl mx-auto px-4 -mt-10 relative z-20" ref={statsRef}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Participantes Reales', value: stats.totalParticipantes, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Sesiones Impartidas', value: stats.totalSesiones, icon: Calendar, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'Instituciones Aliadas', value: '12+', icon: Award, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' }
          ].map((stat, i) => (
            <div 
              key={i} 
              className={`bg-white dark:bg-[#122A1C] p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-emerald-900/30 flex items-center gap-6 ${statsVis ? 'anim-fade-up' : 'opacity-0'}`} 
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className={`w-16 h-16 rounded-2xl ${stat.bg} flex items-center justify-center shrink-0`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div>
                <p className="text-3xl font-black text-gray-900 dark:text-white leading-none mb-1">{stat.value}</p>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Hall of Fame (Top Sesiones) */}
      <section className="py-24 max-w-7xl mx-auto px-4" ref={fameRef}>
        <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 ${fameVis ? 'anim-fade-up' : 'opacity-0'}`}>
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Lo más <span className="text-[#1B4332] dark:text-emerald-500">destacado</span></h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Las sesiones que marcaron tendencia en esta edición.</p>
          </div>
          <div className="hidden md:block h-px flex-1 bg-gray-200 dark:bg-emerald-900/30 mx-8" />
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] border-2 border-amber-500/30 px-4 py-1.5 rounded-full">Top Favoritas</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="h-64 rounded-3xl bg-gray-200 dark:bg-emerald-900/20 animate-pulse" />)
          ) : topSesiones.map((ses, i) => (
            <div 
              key={ses.id} 
              className={`group relative bg-white dark:bg-[#122A1C] rounded-[2.5rem] p-8 border border-gray-100 dark:border-emerald-900/30 shadow-sm hover:shadow-2xl transition-all hover:-translate-y-2 ${fameVis ? 'anim-fade-up' : 'opacity-0'}`}
              style={{ animationDelay: `${0.1 + i * 0.1}s` }}
            >
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center text-[#0D2B1D] font-black shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform">
                #{i+1}
              </div>
              
              <div className="flex items-center gap-2 mb-6">
                <span className="bg-emerald-50 dark:bg-emerald-900/40 text-[#1B4332] dark:text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {ses.total_inscritos} Inscritos
                </span>
                <div className="flex gap-0.5 text-amber-400">
                  <Star size={12} fill="currentColor" />
                  <Star size={12} fill="currentColor" />
                  <Star size={12} fill="currentColor" />
                </div>
              </div>

              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4 leading-snug min-h-[3.5rem] line-clamp-2">
                {ses.nombre}
              </h3>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 text-sm">
                  <MapPin size={16} className="text-[#1B4332] dark:text-emerald-500" />
                  <span>{ses.escenarios?.nombre || 'UES SJR'}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 text-sm">
                  <Clock size={16} className="text-[#1B4332] dark:text-emerald-500" />
                  <span>{ses.hora_inicio?.slice(0,5)} hrs</span>
                </div>
              </div>

              <Link to={`/agenda/${ses.id}`} className="flex items-center justify-between w-full p-4 bg-gray-50 dark:bg-emerald-950/30 rounded-2xl group-hover:bg-[#1B4332] group-hover:text-white transition-all">
                <span className="font-bold text-sm uppercase tracking-widest">Ver Detalles</span>
                <ChevronRight size={20} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Banner de cierre */}
      <section className="bg-white dark:bg-[#0E1F15] py-20" ref={cierreRef}>
        <div className={`max-w-4xl mx-auto px-4 text-center ${cierreVis ? 'anim-fade-up' : 'opacity-0'}`}>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6">¡Nos vemos en la siguiente edición!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-10 leading-relaxed italic">
            "La educación es el arma más poderosa que puedes usar para cambiar el mundo."
          </p>
          <div className="flex flex-wrap justify-center gap-6 grayscale opacity-50">
            <img src="https://ydcybysimlvatvadpbaz.supabase.co/storage/v1/object/public/images/umb.png" className="h-10" alt="UMB" />
            <img src="/images/logos/ues-sjr.png" className="h-10 dark:invert" alt="UES SJR" />
          </div>
        </div>
      </section>

    </div>
  )
}

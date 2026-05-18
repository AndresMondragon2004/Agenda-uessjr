import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays, Clock, Users, Inbox,
  ChevronRight, Plus, UserPlus, FileSearch,
  BarChart2, Bell, FileText, ChevronLeft, Camera
} from 'lucide-react'
import { jornadaService } from '../../services/jornada.service'
import { sesionesService } from '../../services/sesiones.service'
import { supabase } from '../../services/supabase'

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, value, label, sub, subLink, dark = false, urgent = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-6 relative overflow-hidden transition-all duration-300
                  hover:shadow-lg hover:-translate-y-0.5 cursor-pointer
                  ${dark
                    ? 'bg-[#1B4332] text-white'
                    : 'bg-white dark:bg-[#122A1C] text-gray-900 dark:text-gray-100 shadow-sm border border-gray-100 dark:border-emerald-900/40'}`}
    >
      {urgent && (
        <div className="absolute top-4 right-4 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400
                        text-[10px] font-bold rounded-full uppercase tracking-wider
                        flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
          Urgente
        </div>
      )}
      {dark && !urgent && (
        <div className="absolute top-4 right-4 px-2.5 py-1 bg-white/15 border border-white/25
                        text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
          Activa
        </div>
      )}

      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4
                      ${dark ? 'bg-white/15 text-white' : 'bg-[#E6F4F0] dark:bg-emerald-900/30 text-[#1B4332] dark:text-emerald-400'}`}>
        <Icon size={20} />
      </div>

      <div className="space-y-1">
        <p className={`text-[32px] font-black leading-none
                      ${dark ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
          {value}
        </p>
        <p className={`text-[11px] font-bold uppercase tracking-wider
                      ${dark ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
          {label}
        </p>
      </div>

      <div className={`mt-6 pt-4 border-t flex items-center justify-between
                      ${dark ? 'border-white/15' : 'border-gray-100 dark:border-emerald-900/40'}`}>
        <p className={`text-xs font-medium truncate max-w-[140px]
                      ${dark ? 'text-white/75' : 'text-gray-600 dark:text-gray-400'}`}>
          {sub}
        </p>
        {subLink && (
          <button className={`text-xs font-bold flex items-center gap-1 shrink-0 ml-2
                            ${dark ? 'text-white/80 hover:text-white' : 'text-[#1B4332] dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300'}`}>
            {subLink} <ChevronRight size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Gráfica de barras con Chart.js ──────────────────────────────────────────
function WeeklyChart({ sesiones = [] }) {
  const canvasRef = { current: null }
  const [chartData, setChartData] = useState([])
  const [chartInstance, setChartInstance] = useState(null)

  useEffect(() => {
    const daysMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 0: 0 }
    sesiones.forEach(s => {
      if (s.dias_jornada?.fecha) {
        const d = new Date(s.dias_jornada.fecha + 'T12:00:00').getDay()
        daysMap[d] = (daysMap[d] || 0) + 1
      }
    })
    const labels  = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    const jsDays  = [1, 2, 3, 4, 5, 6, 0]
    const data    = jsDays.map(d => daysMap[d])
    const max     = Math.max(...data, 1)
    setChartData(data.map((count, i) => ({
      label: labels[i],
      count,
      pct: Math.round((count / max) * 100),
      isToday: jsDays[i] === new Date().getDay(),
    })))
  }, [sesiones])

  const maxCount = Math.max(...chartData.map(d => d.count), 1)

  return (
    <div className="bg-white dark:bg-[#122A1C] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-emerald-900/40 flex-1">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-[#1B4332] rounded-full" />
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Distribución de sesiones</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#1B4332]" />
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Por día
          </span>
        </div>
      </div>

      {/* Gráfica */}
      <div className="relative">
        {/* Líneas guía horizontales */}
        <div className="absolute inset-0 flex flex-col justify-between pb-8 pointer-events-none">
          {[maxCount, Math.round(maxCount * 0.75), Math.round(maxCount * 0.5), Math.round(maxCount * 0.25), 0].map((val, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[9px] text-gray-300 dark:text-emerald-900/70 font-medium w-4 text-right shrink-0">
                {val}
              </span>
              <div className="flex-1 border-t border-dashed border-gray-100 dark:border-emerald-900/30" />
            </div>
          ))}
        </div>

        {/* Barras */}
        <div className="pl-7 h-48 flex items-end justify-between gap-2 pb-8">
          {chartData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full group relative">
              {/* Tooltip */}
              {d.count > 0 && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2
                                opacity-0 group-hover:opacity-100 transition-all duration-200
                                bg-gray-900 text-white text-[9px] font-bold px-2 py-1
                                rounded-lg whitespace-nowrap pointer-events-none z-10
                                -translate-y-1 group-hover:translate-y-0">
                  {d.count} sesión{d.count !== 1 ? 'es' : ''}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4
                                  border-transparent border-t-gray-900" />
                </div>
              )}

              {/* Barra */}
              <div className="w-full relative flex items-end justify-center"
                   style={{ height: '140px' }}>
                {d.count > 0 ? (
                  <div
                    className={`w-full rounded-t-lg transition-all duration-700
                                group-hover:opacity-90
                                ${d.isToday
                                  ? 'bg-[#D97706]'
                                  : 'bg-[#1B4332]'}`}
                    style={{
                      height: `${Math.max((d.count / maxCount) * 140, 4)}px`,
                    }}
                  >
                    {/* Brillo superior */}
                    <div className={`w-full h-1.5 rounded-t-lg opacity-30
                                    ${d.isToday ? 'bg-amber-300' : 'bg-emerald-300'}`} />
                  </div>
                ) : (
                  <div className="w-full rounded-t-lg bg-gray-100 dark:bg-emerald-900/20" style={{ height: '4px' }} />
                )}
              </div>

              {/* Label día */}
              <span className={`text-[10px] font-extrabold
                              ${d.isToday ? 'text-[#D97706]' : 'text-gray-400 dark:text-gray-600'}`}>
                {d.label}
              </span>

              {/* Punto hoy */}
              {d.isToday && (
                <div className="w-1 h-1 rounded-full bg-[#D97706]" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 mt-2 pt-3 border-t border-gray-50 dark:border-emerald-900/30">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#1B4332]" />
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Sesiones</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#D97706]" />
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Hoy</span>
        </div>
        <div className="ml-auto text-[10px] text-gray-300 dark:text-gray-600 font-medium">
          Total: {chartData.reduce((a, b) => a + b.count, 0)} sesiones
        </div>
      </div>
    </div>
  )
}

// ─── Quick Actions ────────────────────────────────────────────────────────────
function QuickActions({ navigate }) {
  const actions = [
    { label: 'Registrar asistencia', icon: Camera,      path: '/admin/check-in'       },
    { label: 'Nueva sesión',        icon: Plus,        path: '/admin/sesiones/nueva' },
    { label: 'Revisar propuestas',  icon: FileSearch,  path: '/admin/propuestas'     },
    { label: 'Ver estudiantes',     icon: UserPlus,    path: '/admin/estudiantes'    },
  ]
  return (
    <div className="bg-white dark:bg-[#122A1C] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-emerald-900/40 w-full lg:w-80">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1 h-5 bg-[#D97706] rounded-full" />
        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Acciones rápidas</h3>
      </div>
      <div className="space-y-2">
        {actions.map((act, i) => (
          <button
            key={i}
            onClick={() => navigate(act.path)}
            className="w-full flex items-center justify-between p-3.5 rounded-xl
                       border border-gray-100 dark:border-emerald-900/40 hover:border-[#1B4332]/30
                       hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-[#0F2018] flex items-center justify-center
                              text-gray-400 group-hover:bg-[#1B4332] group-hover:text-white
                              transition-all">
                <act.icon size={16} />
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300
                               group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                {act.label}
              </span>
            </div>
            <ChevronRight size={15} className="text-gray-300 dark:text-gray-600 group-hover:text-[#1B4332] transition-colors" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Calendar Widget ──────────────────────────────────────────────────────────
function CalendarWidget() {
  const today     = new Date()
  const todayDate = today.getDate()
  const month     = today.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
  const firstDay  = new Date(today.getFullYear(), today.getMonth(), 1).getDay()
  const offset    = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const days      = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

  return (
    <div className="bg-white dark:bg-[#122A1C] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-emerald-900/40 w-full lg:w-80 h-fit lg:self-center">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-[#D97706] rounded-full" />
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm capitalize">{month}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 hover:bg-gray-50 dark:hover:bg-emerald-900/20 rounded-lg text-gray-400 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button className="p-1.5 hover:bg-gray-50 dark:hover:bg-emerald-900/20 rounded-lg text-gray-400 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 mb-2">
        {days.map((d, i) => (
          <span key={i} className="text-[10px] font-bold text-gray-300 dark:text-gray-600 text-center py-1">
            {d}
          </span>
        ))}
      </div>

      {/* Días del mes */}
      <div className="grid grid-cols-7 gap-y-1">
        {/* Espacios vacíos al inicio */}
        {Array.from({ length: offset }).map((_, i) => (
          <span key={`empty-${i}`} />
        ))}
        {/* Días */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
          <button
            key={d}
            className={`text-[11px] font-bold text-center py-1.5 mx-0.5 rounded-lg transition-all
                      ${d === todayDate
                        ? 'bg-[#1B4332] text-white shadow-sm'
                        : d < todayDate
                        ? 'text-gray-300 dark:text-gray-700'
                        : 'text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-emerald-900/20'}`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Hoy */}
      <div className="mt-4 pt-3 border-t border-gray-50 dark:border-emerald-900/30 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#1B4332]" />
        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
          Hoy: {today.toLocaleDateString('es-MX', {
            weekday: 'long', day: 'numeric', month: 'long'
          })}
        </span>
      </div>
    </div>
  )
}

// ─── Popular Sessions Ranking ───────────────────────────────────────────────
function PopularSessions({ ranking = [] }) {
  return (
    <div className="bg-white dark:bg-[#122A1C] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-emerald-900/40 flex-1">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-[#D97706] rounded-full" />
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Sesiones más populares</h3>
        </div>
        <BarChart2 size={16} className="text-gray-300 dark:text-gray-600" />
      </div>

      <div className="space-y-3">
        {ranking.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-600 py-10 text-center">Sin datos de inscripciones aún</p>
        ) : (
          ranking.map((s, i) => (
            <div key={s.id} className="flex items-center gap-4 group">
              <span className="text-xs font-black text-gray-300 dark:text-emerald-900/50 w-4">#{i+1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate group-hover:text-[#1B4332] dark:group-hover:text-emerald-400 transition-colors">
                  {s.nombre}
                </p>
                <div className="w-full bg-gray-100 dark:bg-emerald-900/20 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div 
                    className="h-full bg-[#D97706] rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((s.inscritos / (s.escenarios?.capacidad_maxima || 100)) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-black text-[#D97706] bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-lg">
                  {s.inscritos} alumnos
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Academic Program Chart ───────────────────────────────────────────────────
function ProgramChart({ data = {} }) {
  const LABELS = {
    sistemas: 'Sistemas',
    innovacion_agricola: 'Agrícola',
    contaduria: 'Contaduría',
    docente: 'Docente',
    externo: 'Externo'
  }
  const COLORS = {
    sistemas: '#D97706',
    innovacion_agricola: '#16A34A',
    contaduria: '#2563EB',
    docente: '#B45309',
    externo: '#7C3AED'
  }

  const entries = Object.entries(data).sort((a,b) => b[1] - a[1])
  const total = entries.reduce((acc, curr) => acc + curr[1], 0) || 1

  return (
    <div className="bg-white dark:bg-[#122A1C] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-emerald-900/40 w-full lg:w-80">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-5 bg-[#2563EB] rounded-full" />
        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Participación por carrera</h3>
      </div>
      
      <div className="space-y-5">
        {entries.map(([key, val]) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
              <span className="text-gray-500 dark:text-gray-400">{LABELS[key] || key}</span>
              <span className="text-gray-900 dark:text-white">{val}</span>
            </div>
            <div className="h-2 w-full bg-gray-50 dark:bg-emerald-950/40 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${(val / total) * 100}%`, backgroundColor: COLORS[key] || '#ccc' }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-50 dark:border-emerald-900/30">
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 text-center uppercase tracking-widest">
          Total alumnos: {total}
        </p>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()

  const [jornadaActiva,    setJornadaActiva]    = useState(null)
  const [sesionesHoy,      setSesionesHoy]      = useState([])
  const [todasSesiones,    setTodasSesiones]    = useState([])
  const [totalEstudiantes, setTotalEstudiantes] = useState(0)
  const [totalPropuestas,  setTotalPropuestas]  = useState(0)
  const [propuestasPend,   setPropuestasPend]   = useState([])
  const [sesionesLlenas,   setSesionesLlenas]   = useState([])
  const [progStats,        setProgStats]        = useState({})
  const [popularRanking,   setPopularRanking]   = useState([])
  const [loading,          setLoading]          = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    async function cargar() {
      try {
        setLoading(true)
        const j = await jornadaService.getActiva()
        setJornadaActiva(j)
        
        let sesData = []
        if (j) {
          // Obtener sesiones con conteo de inscritos
          const { data: ses, error: sesErr } = await supabase
            .from('sesiones')
            .select('*, dias_jornada(fecha), escenarios(capacidad_maxima), inscripciones:inscripciones(count)')
            .eq('jornada_id', j.id)
          
          if (sesErr) throw sesErr
          
          sesData = (ses || []).map(s => ({
            ...s,
            inscritos: s.inscripciones?.[0]?.count || 0
          }))

          setTodasSesiones(sesData)
          const now = new Date()
          const localToday = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
          setSesionesHoy(sesData.filter(s => s.dias_jornada?.fecha === localToday))
          
          // Sesiones llenas
          const llenas = sesData.filter(s => s.inscritos >= (s.escenarios?.capacidad_maxima || 9999))
          setSesionesLlenas(llenas)

          // Ranking de populares
          const ranking = [...sesData]
            .sort((a,b) => b.inscritos - a.inscritos)
            .slice(0, 5)
          setPopularRanking(ranking)
        }

        // Stats de estudiantes
        const { data: ests } = await supabase
          .from('estudiantes')
          .select('programa_academico')
        
        setTotalEstudiantes(ests?.length || 0)
        
        const counts = (ests || []).reduce((acc, curr) => {
          const prog = curr.programa_academico || 'sin_dato'
          if (prog === 'externo') return acc
          acc[prog] = (acc[prog] || 0) + 1
          return acc
        }, {})
        setProgStats(counts)
        
        const { data: props, count: propCount } = await supabase
          .from('propuestas')
          .select('*', { count: 'exact' })
          .eq('estado', 'pendiente')
          .order('created_at', { ascending: false })
          .limit(5)
        
        setTotalPropuestas(propCount || 0)
        setPropuestasPend(props || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  const fechaHoy = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div className="min-h-screen bg-[#F2F5F3] dark:bg-[#0A1A11]">

      {/* Topbar */}
      <header className="bg-white/90 dark:bg-[#122A1C]/90 backdrop-blur-md border-b border-gray-100 dark:border-emerald-900/40
                         px-4 sm:px-8 py-5 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div>
            <h1 className="font-extrabold text-[22px] text-gray-900 dark:text-gray-100 leading-none">
              Panel de control
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 font-medium capitalize">
              {fechaHoy}
            </p>
          </div>
          
          <div className="hidden sm:flex items-center gap-6 pl-8 border-l border-gray-100 dark:border-emerald-900/20">
            <img 
              src="https://sic.cultura.gob.mx/imagenes_cache/universidad_4260_g_74199.png" 
              alt="Logo UMB" 
              className="h-10 object-contain drop-shadow-sm" 
            />
            <img 
              src="/images/logos/ues-sjr.png" 
              alt="Logo UES SJR" 
              className="h-10 object-contain brightness-0 dark:invert opacity-80 sm:opacity-100 drop-shadow-sm" 
            />
          </div>
        </div>
        <div className="flex items-center gap-3 relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`w-10 h-10 rounded-xl bg-white dark:bg-[#0F2018] border border-gray-100 dark:border-emerald-900/40
                             flex items-center justify-center transition-colors shadow-sm relative
                             ${showNotifications ? 'text-[#1B4332] dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}
          >
            <Bell size={18} />
            {(totalPropuestas > 0 || sesionesLlenas.length > 0) && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-orange-500 border-2 border-white dark:border-[#0F2018] rounded-full" />
            )}
          </button>

          {showNotifications && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute top-12 right-0 w-80 bg-white dark:bg-[#122A1C] rounded-2xl shadow-2xl border border-gray-100 dark:border-emerald-900/40 z-40 overflow-hidden anim-scale-in">
                <div className="p-4 border-b border-gray-50 dark:border-emerald-900/30 flex items-center justify-between">
                  <h3 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest">Notificaciones</h3>
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[9px] font-black rounded-full uppercase">
                    {totalPropuestas + sesionesLlenas.length} alertas
                  </span>
                </div>
                <div className="max-h-96 overflow-y-auto scrollbar-hide">
                  {propuestasPend.length === 0 && sesionesLlenas.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-600">No hay notificaciones nuevas</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50 dark:divide-emerald-900/20">
                      {/* Alertas de Cupo */}
                      {sesionesLlenas.map(s => (
                        <button
                          key={s.id}
                          onClick={() => { navigate('/admin/sesiones/' + s.id); setShowNotifications(false) }}
                          className="w-full text-left p-4 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex gap-3"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                            <Users size={14} className="text-red-600 dark:text-red-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-red-700 dark:text-red-400 leading-tight">Sesión con cupo lleno</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">{s.nombre}</p>
                          </div>
                        </button>
                      ))}

                      {/* Propuestas */}
                      {propuestasPend.map(prop => (
                        <button
                          key={prop.id}
                          onClick={() => { navigate('/admin/propuestas'); setShowNotifications(false) }}
                          className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-emerald-900/20 transition-colors flex gap-3"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                            <FileText size={14} className="text-[#1B4332] dark:text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-tight">Nueva propuesta recibida</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">{prop.titulo}</p>
                            <p className="text-[9px] text-gray-400 dark:text-gray-600 mt-1 uppercase font-black">
                              {new Date(prop.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => { navigate('/admin/propuestas'); setShowNotifications(false) }}
                  className="w-full py-3 bg-gray-50 dark:bg-[#0F2018] text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest hover:text-[#1B4332] dark:hover:text-emerald-400 transition-colors"
                >
                  Ver toda la actividad
                </button>
              </div>
            </>
          )}

          <button
            onClick={() => navigate('/admin/reportes')}
            className="flex items-center gap-2.5 px-5 py-2.5 bg-[#1B4332] text-white
                       rounded-xl text-sm font-bold shadow-sm hover:bg-[#143024]
                       transition-all hover:-translate-y-0.5"
          >
            <FileText size={16} className="opacity-80" />
            Generar PDF
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {loading ? (
          <div className="space-y-6">
            {/* Skeletons para Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white dark:bg-[#122A1C] border border-gray-100 dark:border-emerald-900/40 animate-pulse rounded-2xl h-40" />
              ))}
            </div>
            {/* Skeletons para Gráficas */}
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="bg-white dark:bg-[#122A1C] border border-gray-100 dark:border-emerald-900/40 animate-pulse rounded-2xl h-80 flex-1" />
              <div className="bg-white dark:bg-[#122A1C] border border-gray-100 dark:border-emerald-900/40 animate-pulse rounded-2xl h-80 lg:w-80" />
            </div>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard
                icon={CalendarDays}
                value={todasSesiones.length}
                label="Sesiones registradas"
                sub={jornadaActiva?.nombre || '—'}
                subLink="Ver todas"
                dark={true}
                onClick={() => navigate('/admin/sesiones')}
              />
              <StatCard
                icon={Clock}
                value={sesionesHoy.length}
                label="Sesiones hoy"
                sub={(() => {
                  if (sesionesHoy.length === 0) return 'Sin sesiones para hoy'
                  const ahora = new Date()
                  const hhmm = `${String(ahora.getHours()).padStart(2,'0')}:${String(ahora.getMinutes()).padStart(2,'0')}`
                  const enCurso = sesionesHoy.find(s => s.hora_inicio?.slice(0,5) <= hhmm && (!s.hora_fin || s.hora_fin?.slice(0,5) > hhmm))
                  if (enCurso) return `En curso: ${enCurso.nombre}`
                  const proxima = sesionesHoy.filter(s => s.hora_inicio?.slice(0,5) > hhmm).sort((a,b) => a.hora_inicio.localeCompare(b.hora_inicio))[0]
                  if (proxima) return `Próxima: ${proxima.hora_inicio?.slice(0,5)}`
                  return 'Sesiones finalizadas'
                })()}
                onClick={() => navigate('/admin/sesiones')}
              />
              <StatCard
                icon={Users}
                value={totalEstudiantes}
                label="Estudiantes registrados"
                sub="En el sistema"
                onClick={() => navigate('/admin/estudiantes')}
              />
              <StatCard
                icon={Inbox}
                value={totalPropuestas}
                label="Propuestas pendientes"
                sub={totalPropuestas > 0 ? 'Requieren atención' : 'Al día'}
                subLink={totalPropuestas > 0 ? 'Revisar' : undefined}
                urgent={totalPropuestas > 0}
                onClick={() => navigate('/admin/propuestas')}
              />
            </div>

            {/* Gráfica + Acciones rápidas */}
            <div className="flex flex-col lg:flex-row gap-6">
              <WeeklyChart sesiones={todasSesiones} />
              <QuickActions navigate={navigate} />
            </div>

            {/* Populares + Carreras */}
            <div className="flex flex-col lg:flex-row gap-6">
              <PopularSessions ranking={popularRanking} />
              <ProgramChart data={progStats} />
            </div>

            {/* Sesiones de hoy + Calendario */}
            <div className="flex flex-col lg:flex-row gap-6">

              {/* Sesiones de hoy */}
              <div className="bg-white dark:bg-[#122A1C] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-emerald-900/40 flex-1">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-5 bg-[#1B4332] rounded-full" />
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Sesiones de hoy</h3>
                    {sesionesHoy.length > 0 && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800
                                       text-[10px] font-bold rounded-full">
                        {sesionesHoy.length}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => navigate('/admin/sesiones')}
                    className="text-xs font-bold text-[#D97706] hover:text-amber-700
                               flex items-center gap-1 transition-colors"
                  >
                    Ver todas <ChevronRight size={13} />
                  </button>
                </div>

                {sesionesHoy.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-[#0F2018] flex items-center
                                    justify-center text-gray-200 dark:text-emerald-900/50">
                      <Clock size={28} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        Sin sesiones programadas hoy
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        Cambia las fechas de la jornada para ver sesiones
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sesionesHoy.map(s => (
                      <div
                        key={s.id}
                        onClick={() => navigate('/admin/sesiones/' + s.id)}
                        className="flex items-center justify-between p-4 rounded-xl
                                   border border-gray-50 dark:border-emerald-900/30 hover:border-emerald-100 dark:hover:border-emerald-800/50
                                   hover:bg-emerald-50/40 dark:hover:bg-emerald-900/20 transition-all group cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#1B4332]/8 dark:bg-emerald-900/30 border border-[#1B4332]/10 dark:border-emerald-700/30
                                          flex flex-col items-center justify-center shrink-0">
                            <span className="text-[10px] font-black text-[#1B4332] dark:text-emerald-400 leading-none">
                              {s.hora_inicio?.slice(0,5)}
                            </span>
                            <span className="text-[8px] text-[#1B4332]/50 dark:text-emerald-600 font-medium">hrs</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight
                                          group-hover:text-[#1B4332] dark:group-hover:text-emerald-400 transition-colors">
                              {s.nombre}
                            </p>
                            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500
                                          uppercase tracking-wider mt-0.5">
                              {s.escenarios?.nombre || 'Aula general'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={16}
                          className="text-gray-200 dark:text-gray-700 group-hover:text-[#1B4332] dark:group-hover:text-emerald-400 transition-colors shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <CalendarWidget />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
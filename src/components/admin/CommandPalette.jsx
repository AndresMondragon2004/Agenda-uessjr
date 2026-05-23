import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, Calendar, FileText, LayoutDashboard, MapPin, X, ArrowRight, Loader2, Megaphone, Camera, List } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { norm } from '../../utils/search'

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ students: [], sessions: [], proposals: [], pages: [] })
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const STATIC_PAGES = [
    { id: 'p1',  title: 'Panel de Control',                  path: '/admin/dashboard',      icon: LayoutDashboard },
    { id: 'p2',  title: 'Gestión de Sesiones',               path: '/admin/sesiones',       icon: Calendar },
    { id: 'p6',  title: 'Crear nueva sesión',                path: '/admin/sesiones/nueva', icon: Calendar, highlight: true },
    { id: 'p3',  title: 'Propuestas de actividad',           path: '/admin/propuestas',     icon: FileText },
    { id: 'p4',  title: 'Listado de estudiantes',            path: '/admin/estudiantes',    icon: Users },
    { id: 'p5',  title: 'Escenarios y sedes',                path: '/admin/escenarios',     icon: MapPin },
    { id: 'p7',  title: 'Reportes y estadísticas',           path: '/admin/reportes',       icon: FileText },
    { id: 'p8',  title: 'Configurar fechas (Jornada)',       path: '/admin/jornada',        icon: Calendar },
    { id: 'p9',  title: 'Gestión de equipo',                 path: '/admin/equipo',         icon: Users },
    { id: 'p10', title: 'Anuncios y Mensajes',               path: '/admin/anuncios',       icon: Megaphone, highlight: true },
    { id: 'p11', title: 'Registrar asistencia (Check-In)',   path: '/admin/check-in',       icon: Camera },
    { id: 'p12', title: 'Agenda simplificada',               path: '/admin/agenda-simple',  icon: List },
  ]

  const search = useCallback(async (q) => {
    const trimmed = q.trim()
    const nq = norm(trimmed) // versión sin acentos ni mayúsculas

    if (!trimmed || trimmed.length < 2) {
      setResults({ students: [], sessions: [], proposals: [], scenarios: [], pages: STATIC_PAGES })
      return
    }

    setLoading(true)
    try {
      const [sts, ses, props, esc] = await Promise.all([
        supabase.rpc('search_estudiantes', { search_term: trimmed }),
        supabase.rpc('search_sesiones',    { search_term: trimmed }),
        supabase.rpc('search_propuestas',  { search_term: trimmed }),
        supabase.rpc('search_escenarios',  { search_term: trimmed }),
      ])

      setResults({
        students:  (sts.data  || []).slice(0, 5),
        sessions:  (ses.data  || []).slice(0, 5),
        proposals: (props.data || []).slice(0, 5),
        scenarios: (esc.data  || []).slice(0, 5),
        pages: STATIC_PAGES.filter(p => norm(p.title).includes(nq)),
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        isOpen ? onClose() : null // Handled by parent but good to keep
      }
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const allResults = [
    ...results.pages.map(p => ({ ...p, type: 'Acción', url: p.path })),
    ...results.sessions.map(s => ({ id: s.id, title: s.nombre, sub: s.hora_inicio, type: 'Sesión', url: `/admin/sesiones/${s.id}`, icon: Calendar })),
    ...results.students.map(s => ({ id: s.id, title: `${s.nombre} ${s.apellidos}`, sub: s.matricula, type: 'Estudiante', url: `/admin/estudiantes`, state: { selectedStudentId: s.id }, icon: Users })),
    ...results.scenarios.map(s => ({ id: s.id, title: s.nombre, sub: s.ubicacion, type: 'Escenario', url: `/admin/escenarios`, icon: MapPin })),
    ...results.proposals.map(p => ({ id: p.id, title: p.titulo, sub: p.nombre_completo, type: 'Propuesta', url: `/admin/propuestas`, icon: FileText }))
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 sm:px-6">
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#122A1C] rounded-3xl shadow-2xl border border-gray-100 dark:border-emerald-900/40 overflow-hidden anim-scale-in">
        <div className="flex items-center p-5 border-b border-gray-50 dark:border-emerald-900/20">
          <Search className="w-5 h-5 text-gray-400 mr-4" />
          <input
            autoFocus
            type="text"
            placeholder="Buscar alumnos, sesiones o acciones rápidas... (Ctrl+K)"
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 font-bold placeholder:text-gray-400"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-gray-50 dark:bg-[#0F2018] border border-gray-200 dark:border-emerald-900/50 rounded-lg text-[10px] font-black text-gray-400 uppercase">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-2 scrollbar-hide">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#1B4332] mx-auto mb-2" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Buscando en el sistema...</p>
            </div>
          ) : allResults.length === 0 ? (
            <div className="py-20 text-center opacity-40">
              <p className="text-sm font-bold text-gray-400">No se encontraron resultados para "{query}"</p>
            </div>
          ) : (
            allResults.map((item, i) => (
              <button
                key={item.id || item.path}
                onClick={() => { navigate(item.url, { state: item.state }); onClose(); }}
                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 group transition-all text-left"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${item.highlight ? 'bg-emerald-100 text-[#1B4332] dark:bg-emerald-900/40' : 'bg-gray-50 dark:bg-[#0F2018] text-gray-400'} group-hover:bg-[#1B4332] group-hover:text-white`}>
                    <item.icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-gray-900 dark:text-gray-100 truncate">{item.title}</span>
                      <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded ${item.type === 'Acción' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-[#1B4332] dark:text-emerald-400' : 'bg-gray-100 dark:bg-emerald-950 text-gray-500 dark:text-emerald-500'}`}>
                        {item.type}
                      </span>
                    </div>
                    {item.sub && <p className="text-[11px] font-bold text-gray-400 mt-0.5 truncate">{item.sub}</p>}
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-200 dark:text-emerald-900/50 group-hover:text-[#1B4332] group-hover:translate-x-1 transition-all" />
              </button>
            ))
          )}
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-[#0F2018]/50 border-t border-gray-100 dark:border-emerald-900/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-emerald-900/20 border border-gray-200 dark:border-emerald-700/50 rounded shadow-sm">Enter</kbd>
              <span>para ir</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-emerald-900/20 border border-gray-200 dark:border-emerald-700/50 rounded shadow-sm">Ctrl + K</kbd>
              <span>abrir buscador</span>
            </div>
          </div>
          <span className="text-[10px] font-black text-[#1B4332] dark:text-emerald-600 uppercase tracking-widest">UESSJR Agenda v1.0</span>
        </div>
      </div>
    </div>
  )
}

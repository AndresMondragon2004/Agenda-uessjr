import { useState, useEffect } from 'react'
import { 
  CalendarDays, Download, ChevronLeft, Search, 
  MapPin, Clock, FileText, Loader2 
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { jornadaService } from '../../services/jornada.service'
import { sesionesService } from '../../services/sesiones.service'
import { generateAgendaPDF } from '../../utils/pdfGenerator'

export default function AgendaSimple() {
  const navigate = useNavigate()
  const [jornada,    setJornada]    = useState(null)
  const [sesiones,   setSesiones]   = useState([])
  const [dias,       setDias]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [diaFiltro,  setDiaFiltro]  = useState('todos')
  const [busqueda,   setBusqueda]   = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    async function cargar() {
      try {
        setLoading(true)
        const j = await jornadaService.getActiva()
        setJornada(j)
        if (j) {
          const diasOrdenados = (j.dias_jornada || [])
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
          setDias(diasOrdenados)
          const data = await sesionesService.getByJornada(j.id)
          setSesiones(data || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  const sesionesFiltradas = sesiones
    .filter(s => diaFiltro === 'todos' || s.dia_jornada_id === diaFiltro)
    .filter(s => {
      if (!busqueda) return true
      const q = busqueda.toLowerCase()
      return s.nombre?.toLowerCase().includes(q) ||
        s.ponente_nombre?.toLowerCase().includes(q)
    })
    .sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''))

  const handleDownloadPDF = async () => {
    try {
      setGenerating(true)
      await generateAgendaPDF(jornada, sesionesFiltradas, {
        incluyePonentes: true,
        diasSeleccionados: diaFiltro
      })
    } catch (err) {
      console.error(err)
      alert('Error al generar PDF')
    } finally {
      setGenerating(false)
    }
  }

  function formatShortDay(dia) {
    const d = new Date(dia.fecha + 'T12:00:00')
    const nombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    return `${nombres[d.getDay()]} ${d.getDate()}`
  }

  return (
    <div className="min-h-screen bg-[#F2F5F3] dark:bg-[#0A1A11]">
      {/* Topbar */}
      <div className="bg-white dark:bg-[#122A1C] border-b border-gray-100 dark:border-emerald-900/40 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-14 lg:top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl text-gray-400 dark:text-gray-500 hover:text-[#1B4332] dark:hover:text-emerald-400 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-black text-xl text-gray-900 dark:text-gray-100 tracking-tight">Vista de agenda</h1>
        </div>
        
        <button
          onClick={handleDownloadPDF}
          disabled={generating || loading || sesiones.length === 0}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#1B4332] text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-[#002F1D] transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/10"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Descargar PDF
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Filtros */}
        <div className="bg-white dark:bg-[#122A1C] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-emerald-900/40 mb-8 space-y-5">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por actividad o ponente..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-100 dark:border-emerald-900/50 bg-gray-50/50 dark:bg-[#0F2018] focus:bg-white dark:focus:bg-[#0F2018] focus:border-[#1B4332] outline-none transition-all text-sm font-bold dark:text-gray-300"
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
              <button
                onClick={() => setDiaFiltro('todos')}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                  ${diaFiltro === 'todos' 
                    ? 'bg-[#1B4332] text-white' 
                    : 'bg-gray-50 dark:bg-[#0F2018] text-gray-400 dark:text-gray-500 hover:text-[#1B4332]'}`}
              >
                Todos
              </button>
              {dias.map(dia => (
                <button
                  key={dia.id}
                  onClick={() => setDiaFiltro(dia.id)}
                  className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                    ${diaFiltro === dia.id 
                      ? 'bg-[#1B4332] text-white' 
                      : 'bg-gray-50 dark:bg-[#0F2018] text-gray-400 dark:text-gray-500 hover:text-[#1B4332]'}`}
                >
                  {formatShortDay(dia)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Listado */}
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white dark:bg-[#122A1C] h-24 rounded-3xl animate-pulse border border-gray-100 dark:border-emerald-900/40" />
            ))}
          </div>
        ) : sesionesFiltradas.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-[#122A1C] rounded-3xl border border-dashed border-gray-200 dark:border-emerald-900/40">
            <p className="font-black text-gray-300 dark:text-emerald-900/50 uppercase tracking-widest">Sin resultados</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#122A1C] rounded-3xl overflow-hidden border border-gray-100 dark:border-emerald-900/40 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#0F2018] border-b border-gray-100 dark:border-emerald-900/40">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Hora</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actividad</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Ubicación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-emerald-900/20">
                {sesionesFiltradas.map(ses => (
                  <tr key={ses.id} className="group hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-[#1B4332] dark:text-emerald-400 leading-none">
                          {ses.hora_inicio?.slice(0, 5)}
                        </span>
                        <span className="text-[9px] font-bold text-gray-300 dark:text-gray-600 mt-1 uppercase">
                          {ses.dias_jornada?.nombre_dia}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-[#1B4332] dark:group-hover:text-emerald-400 transition-colors">
                        {ses.nombre}
                      </p>
                      <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mt-0.5">
                        {ses.ponente_nombre}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
                        <MapPin size={12} strokeWidth={3} />
                        {ses.escenarios?.nombre || '—'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Eye, Edit2, Trash2,
  CalendarDays, Check
} from 'lucide-react'
import { sesionesService } from '../../services/sesiones.service'
import { jornadaService } from '../../services/jornada.service'

// ─── Constantes ───────────────────────────────────────────────────────────────
const TIPO_COLORS = {
  inauguracion: 'bg-blue-100 text-blue-800',
  conferencia:  'bg-emerald-100 text-emerald-800',
  taller:       'bg-amber-100 text-amber-800',
  cultural:     'bg-purple-100 text-purple-800',
  protocolo:    'bg-gray-100 text-gray-700',
  competencia:  'bg-orange-100 text-orange-800',
  cierre:       'bg-rose-100 text-rose-800',
}
const TIPO_LABELS = {
  inauguracion: 'Inauguración',
  conferencia:  'Conferencia',
  taller:       'Taller',
  cultural:     'Cultural',
  protocolo:    'Protocolo',
  competencia:  'Competencia',
  cierre:       'Cierre',
}
const ESTADO_COLORS = {
  activa:    'bg-emerald-100 text-emerald-800',
  borrador:  'bg-amber-100 text-amber-700',
  cancelada: 'bg-red-100 text-red-700',
}
const ESTADO_LABELS = {
  activa:    'Activa',
  borrador:  'Borrador',
  cancelada: 'Cancelada',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatShortDay(fecha) {
  if (!fecha) return '—'
  const d = new Date(fecha + 'T12:00:00')
  const nombres = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
  return `${nombres[d.getDay()]} ${d.getDate()}`
}

function formatTime(t) {
  if (!t) return '—'
  return t.slice(0, 5)
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ sesion, onClose, onConfirm, deleting }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">¿Eliminar esta sesión?</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
          Se eliminará <strong>"{sesion.nombre}"</strong>.
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mb-6">
          Esta acción eliminará también los registros de inscripciones asociados.
        </p>
        <div className="space-y-3">
          <button onClick={onConfirm} disabled={deleting}
                  className="w-full py-2.5 bg-red-600 text-white font-semibold rounded-lg
                             hover:bg-red-700 transition-colors disabled:opacity-50">
            {deleting ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
          <button onClick={onClose}
                  className="w-full py-2.5 text-gray-700 dark:text-gray-300 font-semibold border border-gray-300 dark:border-emerald-900/40
                             rounded-lg hover:bg-gray-50 dark:hover:bg-emerald-900/20 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── SesionCard ───────────────────────────────────────────────────────────────
function SesionCard({ ses, inscritos, cupo, navigate, onDelete, dias, onAsignarDia }) {
  const pct = cupo ? Math.min((inscritos / cupo) * 100, 100) : 0

  // Extraer fecha directamente del objeto anidado dias_jornada
  const diaFecha    = ses.dias_jornada?.fecha     ?? null
  const diaNombre   = ses.dias_jornada?.nombre_dia ?? null
  const sinDia      = !ses.dia_jornada_id

  return (
    <div className={`bg-white dark:bg-[#122A1C] rounded-3xl p-6 border shadow-sm
                    hover:shadow-xl hover:shadow-emerald-900/5 transition-all group
                    ${sinDia ? 'border-amber-200 dark:border-amber-900/50' : 'border-gray-100 dark:border-emerald-900/40'}`}>
      <div className="flex flex-col md:flex-row md:items-center gap-6">

        {/* Horario */}
        <div className="md:w-32 flex md:flex-col items-center md:items-start gap-2
                        border-b md:border-b-0 md:border-r border-gray-50 dark:border-emerald-900/30
                        pb-4 md:pb-0 md:pr-6 shrink-0">
          <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            {diaFecha ? formatShortDay(diaFecha) : '—'}
          </span>
          <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-[#1B4332] dark:text-emerald-400 rounded-xl
                           text-xs font-black border border-emerald-100 dark:border-emerald-900/50">
            {formatTime(ses.hora_inicio)}
          </span>
        </div>

        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black
                             uppercase tracking-widest border
                             ${TIPO_COLORS[ses.tipo] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
              {TIPO_LABELS[ses.tipo] || ses.tipo}
            </span>
            {ses.estado !== 'activa' && (
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black
                               uppercase tracking-widest
                               ${ESTADO_COLORS[ses.estado] || ''}`}>
                {ESTADO_LABELS[ses.estado] || ses.estado}
              </span>
            )}
          </div>
          <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 group-hover:text-[#1B4332] dark:group-hover:text-emerald-400
                         transition-colors truncate">
            {ses.nombre}
          </h3>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500">
              {ses.ponente_nombre || 'Sin ponente asignado'}
            </p>
            {ses.escenarios?.nombre && (
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase
                               tracking-tighter bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-lg">
                {ses.escenarios.nombre}
              </span>
            )}
          </div>
        </div>

        {/* Cupo */}
        <div className="md:w-44 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
              Inscripciones
            </span>
            <span className={`text-xs font-black ${pct >= 90 ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}`}>
              {inscritos} / {cupo || '—'}
            </span>
          </div>
          <div className="h-2 bg-gray-50 dark:bg-emerald-900/20 rounded-full overflow-hidden border border-gray-100 dark:border-emerald-900/30">
            <div
              className={`h-full rounded-full transition-all duration-700
                          ${pct >= 90 ? 'bg-red-500' : 'bg-[#1B4332]'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Selector rápido de día (solo visible si no tiene día asignado) */}
        {sinDia && dias?.length > 0 && (
          <div className="shrink-0 flex flex-col gap-1">
            <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">
              Asignar día
            </span>
            <select
              defaultValue=""
              onChange={e => e.target.value && onAsignarDia(ses.id, e.target.value)}
              onClick={e => e.stopPropagation()}
              className="px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20
                         text-xs font-bold text-amber-800 dark:text-amber-400 outline-none cursor-pointer
                         focus:border-amber-500 hover:border-amber-400 transition-colors"
            >
              <option value="">Seleccionar día...</option>
              {dias.map(dia => (
                <option key={dia.id} value={dia.id}>
                  {dia.nombre_dia} {new Date(dia.fecha + 'T12:00:00').getDate()}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100
                        transition-all pt-4 md:pt-0 border-t md:border-t-0 border-gray-50 dark:border-emerald-900/30">
          <button onClick={() => navigate('/admin/sesiones/' + ses.id)}
                  className="p-2.5 text-gray-400 border border-gray-100 dark:border-emerald-900/40 rounded-xl
                             hover:text-[#1B4332] hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-100 dark:hover:border-emerald-800
                             transition-all" title="Ver detalle">
            <Eye className="w-5 h-5" />
          </button>
          <button onClick={() => navigate('/admin/sesiones/editar/' + ses.id)}
                  className="p-2.5 text-gray-400 border border-gray-100 dark:border-emerald-900/40 rounded-xl
                             hover:text-[#1B4332] hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-100 dark:hover:border-emerald-800
                             transition-all" title="Editar">
            <Edit2 className="w-5 h-5" />
          </button>
          <button onClick={() => onDelete(ses)}
                  className="p-2.5 text-gray-400 border border-gray-100 dark:border-emerald-900/40 rounded-xl
                             hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-100 dark:hover:border-red-900/40
                             transition-all" title="Eliminar">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Separador de día ─────────────────────────────────────────────────────────
function DaySeparator({ fecha, nombreDia, count }) {
  const fechaFormateada = fecha
    ? new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
        day: 'numeric', month: 'long'
      })
    : null

  return (
    <div className="flex items-center gap-4 mb-4 mt-6 first:mt-0">
      <div className="flex items-center gap-2 bg-[#1B4332]/8 dark:bg-emerald-900/30 px-4 py-2 rounded-xl">
        <CalendarDays className="w-3.5 h-3.5 text-[#1B4332] dark:text-emerald-400" />
        <span className="text-[10px] font-black text-[#1B4332] dark:text-emerald-400 uppercase tracking-widest">
          {nombreDia && fechaFormateada
            ? `${nombreDia} ${fechaFormateada}`
            : fechaFormateada || 'Sin día asignado'}
        </span>
        <span className="text-[9px] font-bold text-[#1B4332]/50">
          · {count} sesión{count !== 1 ? 'es' : ''}
        </span>
      </div>
      <div className="flex-1 h-px bg-gray-100 dark:bg-emerald-900/30" />
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SessionsManagement() {
  const navigate = useNavigate()

  const [sesiones,        setSesiones]        = useState([])
  const [dias,            setDias]            = useState([])
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState(null)
  const [diaFiltro,       setDiaFiltro]       = useState('todos')
  const [tipoFiltro,      setTipoFiltro]      = useState('todos')
  const [busqueda,        setBusqueda]        = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [sesionAEliminar, setSesionAEliminar] = useState(null)
  const [deleting,        setDeleting]        = useState(false)
  const [toast,           setToast]           = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // ── Carga ──────────────────────────────────────────────────────────────────
  const cargarDatos = async () => {
    try {
      setLoading(true)
      setError(null)

      const jornada = await jornadaService.getActiva()
      const diasOrdenados = (jornada.dias_jornada || [])
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      setDias(diasOrdenados)

      const data = await sesionesService.getByJornada(jornada.id)
      setSesiones(data || [])

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarDatos() }, [])

  // ── Filtrado y ordenamiento ────────────────────────────────────────────────
  //
  // CLAVE: dias_jornada viene como objeto anidado con { id, fecha, nombre_dia }
  // El campo local dia_jornada_id es el UUID que usamos para filtrar
  // Ordenamos por dias_jornada.fecha (string YYYY-MM-DD) y luego hora_inicio
  //
  const sesionesFiltradas = sesiones
    .filter(s => {
      if (diaFiltro === 'todos') return true
      // Comparar contra el UUID del día seleccionado
      return s.dia_jornada_id === diaFiltro
    })
    .filter(s =>
      tipoFiltro === 'todos' || s.tipo === tipoFiltro
    )
    .filter(s => {
      if (!busqueda) return true
      const q = busqueda.toLowerCase()
      return (
        s.nombre?.toLowerCase().includes(q) ||
        s.ponente_nombre?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      // Ordenar por fecha del día (string YYYY-MM-DD, comparación lexicográfica)
      const fechaA = a.dias_jornada?.fecha ?? '9999-12-31'
      const fechaB = b.dias_jornada?.fecha ?? '9999-12-31'
      if (fechaA < fechaB) return -1
      if (fechaA > fechaB) return 1
      // Mismo día → ordenar por hora_inicio (string HH:MM:SS)
      const horaA = a.hora_inicio ?? '23:59:59'
      const horaB = b.hora_inicio ?? '23:59:59'
      return horaA.localeCompare(horaB)
    })

  // ── Agrupar por día para vista "todos" ────────────────────────────────────
  const grupos = (() => {
    const map = new Map()
    sesionesFiltradas.forEach(ses => {
      const key   = ses.dias_jornada?.fecha ?? '__sin_dia__'
      const nombre = ses.dias_jornada?.nombre_dia ?? null
      if (!map.has(key)) map.set(key, { fecha: key === '__sin_dia__' ? null : key, nombre, sesiones: [] })
      map.get(key).sesiones.push(ses)
    })
    return Array.from(map.values())
  })()

  // ── Asignar día rápido ────────────────────────────────────────────────────
  const handleAsignarDia = async (sesionId, diaJornadaId) => {
    try {
      await sesionesService.update(sesionId, { dia_jornada_id: diaJornadaId })
      cargarDatos()
      showToast('Día asignado correctamente')
    } catch (err) {
      setError(err.message)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteClick  = ses => { setSesionAEliminar(ses); setShowDeleteModal(true) }
  const handleDeleteClose  = ()  => { setShowDeleteModal(false); setSesionAEliminar(null) }

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true)
      await sesionesService.delete(sesionAEliminar.id)
      handleDeleteClose()
      cargarDatos()
      showToast('Sesión eliminada')
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Topbar */}
      <div className="bg-white dark:bg-[#122A1C] border-b border-gray-100 dark:border-emerald-900/40 px-4 sm:px-8 py-4
                      flex items-center justify-between sticky top-14 lg:top-0 z-10">
        <div className="flex items-center gap-8">
          <div>
            <h1 className="font-black text-xl text-gray-900 dark:text-gray-100 tracking-tight">
              Sesiones de la jornada
            </h1>
            {!loading && (
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">
                {sesiones.length} actividades programadas
              </p>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-6 pl-8 border-l border-gray-100 dark:border-emerald-900/20">
            <img 
              src="https://sic.cultura.gob.mx/imagenes_cache/universidad_4260_g_74199.png" 
              alt="Logo UMB" 
              className="h-9 object-contain opacity-90" 
            />
            <img 
              src="/images/logos/ues-sjr.png" 
              alt="Logo UES SJR" 
              className="h-9 object-contain brightness-0 dark:invert opacity-80" 
            />
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/sesiones/nueva')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1B4332] text-white
                     text-[10px] font-black uppercase tracking-widest rounded-xl
                     hover:bg-[#002F1D] hover:-translate-y-0.5 transition-all
                     shadow-lg shadow-emerald-900/10"
        >
          <Plus className="w-4 h-4" strokeWidth={3} />
          Nueva Sesión
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500
                          text-red-700 dark:text-red-400 text-sm rounded-xl font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white dark:bg-[#122A1C] border border-gray-100 dark:border-emerald-900/40 rounded-3xl p-6
                                     shadow-sm animate-pulse flex gap-6">
                <div className="w-24 h-16 bg-gray-50 dark:bg-emerald-900/20 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-48 bg-gray-50 dark:bg-emerald-900/20 rounded" />
                  <div className="h-6 w-full bg-gray-50 dark:bg-emerald-900/20 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* ── Filtros ── */}
            <div className="bg-white dark:bg-[#122A1C] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-emerald-900/40 mb-8 space-y-5">

              {/* Búsqueda + tipo */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar sesión o ponente..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-100 dark:border-emerald-900/50
                               bg-gray-50/50 dark:bg-[#0F2018] focus:bg-white dark:focus:bg-[#0F2018] focus:border-[#1B4332]
                               outline-none transition-all text-sm font-bold dark:text-gray-300 dark:placeholder-gray-600"
                  />
                </div>
                <select
                  value={tipoFiltro}
                  onChange={e => setTipoFiltro(e.target.value)}
                  className="px-4 py-3 rounded-2xl border border-gray-100 dark:border-emerald-900/50 bg-gray-50/50 dark:bg-[#0F2018]
                             focus:bg-white dark:focus:bg-[#0F2018] outline-none text-xs font-black uppercase
                             tracking-widest cursor-pointer min-w-[160px] dark:text-gray-300"
                >
                  <option value="todos">Todos los tipos</option>
                  {Object.entries(TIPO_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Pills de días */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setDiaFiltro('todos')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase
                              tracking-widest transition-all whitespace-nowrap shrink-0
                              ${diaFiltro === 'todos'
                                ? 'bg-[#1B4332] text-white shadow-md'
                                : 'bg-gray-50 dark:bg-emerald-950/50 text-gray-400 dark:text-gray-500 border border-transparent hover:border-gray-200 dark:hover:border-emerald-900/40'}`}
                >
                  Todos los días
                </button>
                {dias.map(dia => (
                  <button
                    key={dia.id}
                    onClick={() => setDiaFiltro(dia.id)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase
                                tracking-widest transition-all whitespace-nowrap shrink-0 border
                                ${diaFiltro === dia.id
                                  ? 'bg-[#1B4332] text-white border-[#1B4332]'
                                  : 'bg-white dark:bg-emerald-950/50 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-emerald-900/40 hover:border-emerald-100 dark:hover:border-emerald-800'}`}
                  >
                    {formatShortDay(dia.fecha)}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Aviso sesiones sin día ── */}
            {(() => {
              const sinDia = sesiones.filter(s => !s.dia_jornada_id).length
              return sinDia > 0 ? (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl
                                flex items-center gap-3">
                  <span className="text-2xl shrink-0">⚠️</span>
                  <div>
                    <p className="text-sm font-black text-amber-800 dark:text-amber-300">
                      {sinDia} sesión{sinDia !== 1 ? 'es' : ''} sin día asignado
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                      Usa el selector "Asignar día" en cada tarjeta para organizarlas.
                      Sin día asignado no aparecen en la agenda pública ni responden a los filtros.
                    </p>
                  </div>
                </div>
              ) : null
            })()}

            {/* ── Listado ── */}
            {sesionesFiltradas.length === 0 ? (
              <div className="py-24 text-center bg-white dark:bg-[#122A1C] rounded-3xl
                              border border-dashed border-gray-200 dark:border-emerald-900/40">
                <CalendarDays className="w-16 h-16 text-gray-100 dark:text-emerald-900/50 mx-auto mb-4" />
                <p className="font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest text-sm">
                  No se encontraron sesiones
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {diaFiltro !== 'todos'
                    ? 'No hay sesiones para este día con los filtros actuales'
                    : 'Registra la primera sesión con el botón de arriba'}
                </p>
              </div>
            ) : diaFiltro !== 'todos' ? (
              // ── Vista filtrada por día (sin agrupación) ──
              <div className="space-y-3">
                {sesionesFiltradas.map(ses => (
                  <SesionCard
                    key={ses.id}
                    ses={ses}
                    inscritos={ses.total_inscritos || 0}
                    cupo={ses.escenarios?.capacidad_maxima || ses.cupo_maximo || 0}
                    navigate={navigate}
                    onDelete={handleDeleteClick}
                    dias={dias}
                    onAsignarDia={handleAsignarDia}
                  />
                ))}
              </div>
            ) : (
              // ── Vista "Todos" con separadores por día ──
              <div>
                {grupos.map(grupo => (
                  <div key={grupo.fecha ?? 'sin-dia'} className="mb-8">
                    <DaySeparator
                      fecha={grupo.fecha}
                      nombreDia={grupo.nombre}
                      count={grupo.sesiones.length}
                    />
                    <div className="space-y-3 pl-2">
                      {grupo.sesiones.map(ses => (
                        <SesionCard
                          key={ses.id}
                          ses={ses}
                          inscritos={ses.total_inscritos || 0}
                          cupo={ses.escenarios?.capacidad_maxima || ses.cupo_maximo || 0}
                          navigate={navigate}
                          onDelete={handleDeleteClick}
                          dias={dias}
                          onAsignarDia={handleAsignarDia}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal eliminar */}
      {showDeleteModal && sesionAEliminar && (
        <DeleteModal
          sesion={sesionAEliminar}
          onClose={handleDeleteClose}
          onConfirm={handleDeleteConfirm}
          deleting={deleting}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-50 bg-[#1B4332] text-white
                        px-8 py-4 rounded-2xl shadow-2xl font-black text-sm
                        flex items-center gap-3">
          <Check className="w-5 h-5" strokeWidth={3} />
          {toast}
        </div>
      )}
    </>
  )
}
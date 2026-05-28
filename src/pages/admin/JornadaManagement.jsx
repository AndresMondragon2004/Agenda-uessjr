import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Edit2, Trash2, Lock, X, CalendarDays, Check, Sparkles } from 'lucide-react'
import { jornadaService } from '../../services/jornada.service'
import { supabase } from '../../services/supabase'



// (Rediseño premium: referencias a monarca eliminadas)

const TABS = ['Todas', 'Activas', 'Finalizadas', 'Borradores']

const NOMBRES_DIA = [
  'Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'
]

const FORM_DEFAULT = {
  nombre:         '',
  edicion:        '',
  lema:           '',
  sede:           'UES San José del Rincón',
  fecha_inicio:   '',
  fecha_fin:      '',
  estado:         'borrador',
  visible_publico: true,
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function formatFechas(inicio, fin) {
  if (!inicio || !fin) return '—'
  const d1   = new Date(inicio + 'T12:00:00')
  const d2   = new Date(fin   + 'T12:00:00')
  const opts = { day: 'numeric', month: 'short', year: 'numeric' }
  const b    = d2.toLocaleDateString('es-MX', opts)
  return d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()
    ? `${d1.getDate()} – ${b}`
    : `${d1.toLocaleDateString('es-MX', opts)} – ${b}`
}

function calcDias(inicio, fin) {
  if (!inicio || !fin) return []
  const dias = []
  let cur    = new Date(inicio + 'T12:00:00')
  const end  = new Date(fin   + 'T12:00:00')
  while (cur <= end) {
    dias.push({ nombre: NOMBRES_DIA[cur.getDay()], num: cur.getDate() })
    cur.setDate(cur.getDate() + 1)
  }
  return dias
}

function StatusBadge({ estado }) {
  if (estado === 'activa')
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs
                       font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Activa
      </span>
    )
  if (estado === 'finalizada')
    return (
      <span className="px-2.5 py-1 text-xs font-semibold rounded-full
                       bg-gray-100 text-gray-600">
        Finalizada
      </span>
    )
  return (
    <span className="px-2.5 py-1 text-xs font-semibold rounded-full
                     bg-amber-100 text-amber-700">
      Borrador
    </span>
  )
}



// (Icons replaced with lucide-react)

// ─── DiasSection ──────────────────────────────────────────────────────────
function DiasSection({ jornada, onDiaDeleted }) {
  const dias = (jornada.dias_jornada || []).sort(
    (a, b) => new Date(a.fecha) - new Date(b.fecha)
  )

  return (
    <tr>
      <td colSpan={7} className="px-4 pb-4 pt-0">
        <div className="bg-[#F0F7F4] border-l-4 border-[#1B4332]/40
                        rounded-xl px-6 py-5">
          <p className="font-bold text-gray-800 text-sm mb-0.5">
            Días registrados — {jornada.nombre}
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Los días se generan automáticamente desde las fechas de la jornada.
            Para modificarlos, edita las fechas.
          </p>

          {dias.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed
                            border-gray-300 rounded-xl bg-white">
              <p className="text-gray-400 text-sm mb-1">
                Sin días registrados
              </p>
              <p className="text-gray-300 text-xs">
                Edita la jornada y asigna fechas para generar los días
                automáticamente.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {dias.map((dia, idx) => {
                const d = new Date(dia.fecha + 'T12:00:00')
                return (
                  <div
                    key={dia.id}
                    className="bg-white rounded-xl border border-gray-200
                               p-4 text-center w-28 relative shadow-sm
                               hover:shadow-md transition-shadow"
                  >
                    <button
                      type="button"
                      onClick={() => onDiaDeleted(dia.id)}
                      title="Eliminar día"
                      className="absolute top-2 right-2 text-gray-300
                                 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <p className="text-2xl font-bold text-[#1B4332]">
                      {idx + 1}
                    </p>
                    <p className="text-xs font-bold text-gray-800 mt-0.5">
                      {dia.nombre_dia}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {d.toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'short'
                      })}
                    </p>
                    <span className="inline-block mt-2 bg-emerald-100
                                     text-emerald-700 text-[10px] font-semibold
                                     px-2 py-0.5 rounded-full">
                      0 sesiones
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

// ─── Toggle inline ─────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 shrink-0 border-2
        ${checked ? 'bg-[#1B4332] border-[#1B4332]' : 'bg-gray-200 dark:bg-emerald-950/50 border-gray-200 dark:border-emerald-900/50'}`}
    >
      <span className={`absolute top-0.5 left-0.5 bg-white rounded-full
        transition-all duration-300 shadow-sm
        ${checked ? 'translate-x-5' : 'translate-x-0'}`} 
        style={{ width: '16px', height: '16px' }}
      />
    </button>
  )
}

// ─── JornadaModal ─────────────────────────────────────────────────────────
function JornadaModal({ jornadaActiva, jornadaEditando, onClose, onSaved }) {
  const [form,   setForm]   = useState(
    jornadaEditando
      ? { ...FORM_DEFAULT, ...jornadaEditando }
      : { ...FORM_DEFAULT }
  )
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  const diasPreview = calcDias(form.fecha_inicio, form.fecha_fin)
  const isEditing   = !!jornadaEditando

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre || !form.edicion || !form.sede ||
        !form.fecha_inicio || !form.fecha_fin) {
      setError('Completa los campos obligatorios: nombre, edición, sede y fechas.')
      return
    }
    if (new Date(form.fecha_fin) < new Date(form.fecha_inicio)) {
      setError('La fecha de fin no puede ser anterior a la fecha de inicio.')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const payload = {
        nombre: form.nombre,
        edicion: form.edicion,
        lema: form.lema,
        sede: form.sede,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        estado: form.estado,
        visible_publico: form.visible_publico
      }

      if (isEditing) {
        if (payload.estado === 'activa') {
          await jornadaService.setActiva(jornadaEditando.id)
          await jornadaService.update(jornadaEditando.id, { ...payload, estado: 'activa' })
        } else {
          await jornadaService.update(jornadaEditando.id, payload)
        }
        const fechasChanged =
          form.fecha_inicio !== jornadaEditando.fecha_inicio ||
          form.fecha_fin    !== jornadaEditando.fecha_fin
        if (fechasChanged) {
          await jornadaService.deleteDiasByJornada(jornadaEditando.id)
          await jornadaService.crearDias(
            jornadaEditando.id, form.fecha_inicio, form.fecha_fin
          )
        }
      } else {
        const saved = await jornadaService.create(payload)
        if (saved && form.fecha_inicio && form.fecha_fin) {
          await jornadaService.crearDias(saved.id, form.fecha_inicio, form.fecha_fin)
        }
        if (payload.estado === 'activa') {
          await jornadaService.setActiva(saved.id)
        }
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-2xl p-8 max-w-3xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {isEditing ? 'Editar jornada' : 'Nueva jornada'}
          </h2>
          <button type="button" onClick={onClose}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400
                          text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre de la jornada *
            </label>
            <input
              name="nombre" value={form.nombre} onChange={handleChange}
              placeholder="Ej. 13va Jornada Académica y Cultural 2026"
              className="w-full px-4 py-2 border border-gray-300 dark:border-emerald-900/40 rounded-lg
                         focus:border-[#1B4332] outline-none bg-white dark:bg-[#0F2018] text-gray-900 dark:text-gray-200"
            />
          </div>

          {/* Edición + Sede */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Edición *
              </label>
              <input
                name="edicion" value={form.edicion} onChange={handleChange}
                placeholder="Ej. 13va"
                className="w-full px-4 py-2 border border-gray-300 dark:border-emerald-900/40 rounded-lg
                           focus:border-[#1B4332] outline-none bg-white dark:bg-[#0F2018] text-gray-900 dark:text-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sede *
              </label>
              <input
                name="sede" value={form.sede} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-emerald-900/40 rounded-lg
                           focus:border-[#1B4332] outline-none bg-white dark:bg-[#0F2018] text-gray-900 dark:text-gray-200"
              />
            </div>
          </div>

          {/* Lema */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Lema{' '}
              <span className="text-gray-400 dark:text-gray-500 font-normal">(opcional)</span>
            </label>
            <input
              name="lema" value={form.lema} onChange={handleChange}
              placeholder="Ej. Cultura que inspira, conocimiento que transforma"
              className="w-full px-4 py-2 border border-gray-300 dark:border-emerald-900/40 rounded-lg
                         focus:border-[#1B4332] outline-none bg-white dark:bg-[#0F2018] text-gray-900 dark:text-gray-200"
            />
          </div>

          {/* Fechas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fechas de la jornada *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Fecha inicio</p>
                <input
                  type="date" name="fecha_inicio"
                  value={form.fecha_inicio} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-emerald-900/40 rounded-lg
                             focus:border-[#1B4332] outline-none bg-white dark:bg-[#0F2018] text-gray-900 dark:text-gray-200"
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Fecha fin</p>
                <input
                  type="date" name="fecha_fin"
                  value={form.fecha_fin} onChange={handleChange}
                  min={form.fecha_inicio}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-emerald-900/40 rounded-lg
                             focus:border-[#1B4332] outline-none bg-white dark:bg-[#0F2018] text-gray-900 dark:text-gray-200"
                />
              </div>
            </div>

            {/* Preview de días */}
            {diasPreview.length > 0 && (
              <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-2">
                  Se generarán {diasPreview.length} día
                  {diasPreview.length !== 1 ? 's' : ''}:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {diasPreview.map((d, i) => (
                    <span key={i}
                          className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs
                                     px-2 py-0.5 rounded-full font-medium">
                      {d.nombre} {d.num}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Estado */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3">
              Estado del Evento
            </label>
            <div className="grid grid-cols-3 gap-2 bg-gray-100 dark:bg-[#0F2018] p-1 rounded-xl border border-gray-200 dark:border-emerald-900/30">
              {['borrador', 'activa', 'finalizada'].map(est => {
                const isActive = form.estado === est
                return (
                  <button
                    key={est}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, estado: est }))}
                    className={`py-2 px-3 rounded-lg text-xs font-bold capitalize transition-all
                      ${isActive 
                        ? 'bg-white dark:bg-[#1B4332] text-[#1B4332] dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                  >
                    {est}
                  </button>
                )
              })}
            </div>
            {form.estado === 'activa' &&
             jornadaActiva &&
             jornadaActiva.id !== jornadaEditando?.id && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400
                              text-amber-700 dark:text-amber-300 text-[10px] font-bold rounded-r-xl leading-relaxed">
                <span className="mr-1">⚠️</span> Esto desactivará automáticamente la jornada activa actual:{' '}
                <span className="underline">{jornadaActiva.nombre}</span>
              </div>
            )}
          </div>

          {/* Toggle visible */}
          <div className="flex items-center justify-between py-3
                          border-t border-gray-100 dark:border-emerald-900/30">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Visible en vista pública
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Los asistentes pueden ver la agenda
              </p>
            </div>
            <Toggle
              checked={form.visible_publico}
              onChange={val => setForm(p => ({ ...p, visible_publico: val }))}
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300
                         border border-gray-300 dark:border-emerald-900/40 rounded-lg hover:bg-gray-50 dark:hover:bg-emerald-900/20
                         transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 px-4 py-2 text-sm font-semibold text-white
                         bg-[#1B4332] rounded-lg hover:bg-emerald-800
                         transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar jornada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── DeleteModal ───────────────────────────────────────────────────────────
function DeleteModal({ jornada, onClose, onConfirm, deleting }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center
                    justify-center p-4">
      <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-2xl p-8 max-w-md w-full
                      text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30
                        flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          ¿Eliminar esta jornada?
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
          Se eliminará <strong>"{jornada.nombre}"</strong> y todos sus días
          registrados.
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mb-6">
          Esta acción no se puede deshacer.
        </p>
        <div className="space-y-3">
          <button
            type="button" onClick={onConfirm} disabled={deleting}
            className="w-full py-2.5 bg-red-600 text-white font-semibold
                       rounded-lg hover:bg-red-700 transition-colors
                       disabled:opacity-50"
          >
            {deleting ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
          <button
            type="button" onClick={onClose}
            className="w-full py-2.5 text-gray-700 dark:text-gray-300 font-semibold
                       border border-gray-300 dark:border-emerald-900/40 rounded-lg hover:bg-gray-50 dark:hover:bg-emerald-900/20
                       transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function JornadaManagement() {
  const navigate = useNavigate()


  const [jornadas,         setJornadas]         = useState([])
  const [jornadaActiva,    setJornadaActiva]    = useState(null)
  const [loading,          setLoading]          = useState(true)
  const [error,            setError]            = useState(null)
  const [tabActivo,        setTabActivo]        = useState('Todas')
  const [expandedId,       setExpandedId]       = useState(null)
  const [showModal,        setShowModal]        = useState(false)
  const [jornadaEditando,  setJornadaEditando]  = useState(null)
  const [showDeleteModal,  setShowDeleteModal]  = useState(false)
  const [jornadaAEliminar, setJornadaAEliminar] = useState(null)
  const [deleting,         setDeleting]         = useState(false)
  const [toast,            setToast]            = useState(null)
  const [showInfoBanner,   setShowInfoBanner]   = useState(true)
  const [sesionesCountByDia, setSesionesCountByDia] = useState({})

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const cargarJornadas = async () => {
    try {
      setLoading(true)
      const data = await jornadaService.getAll()
      setJornadas(data || [])
      setJornadaActiva((data || []).find(j => j.estado === 'activa') || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarJornadas() }, [])

  const jornadasFiltradas = jornadas.filter(j => {
    if (tabActivo === 'Activas')     return j.estado === 'activa'
    if (tabActivo === 'Finalizadas') return j.estado === 'finalizada'
    if (tabActivo === 'Borradores')  return j.estado === 'borrador'
    return true
  })

  const handleOpenCreate  = () => { setJornadaEditando(null); setShowModal(true) }
  const handleOpenEdit    = (j) => { setJornadaEditando(j);   setShowModal(true) }
  const handleCloseModal  = () => { setShowModal(false); setJornadaEditando(null) }
  const handleSaved       = () => {
    handleCloseModal()
    cargarJornadas()
    showToast('Jornada guardada correctamente')
  }
  const handleDeleteClick = (j) => { setJornadaAEliminar(j); setShowDeleteModal(true) }
  const handleDeleteClose = () => { setShowDeleteModal(false); setJornadaAEliminar(null) }

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true)
      await jornadaService.delete(jornadaAEliminar.id)
      handleDeleteClose()
      cargarJornadas()
      showToast('Jornada eliminada')
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleDiaDeleted = async (diaId) => {
    try {
      await jornadaService.deleteDia(diaId)
      cargarJornadas()
      showToast('Día eliminado')
    } catch (err) {
      setError(err.message)
    }
  }

  const toggleExpanded = async (id) => {
    const next = expandedId === id ? null : id
    setExpandedId(next)
    if (next) {
      try {
        const { data } = await supabase
          .from('sesiones')
          .select('dia_jornada_id')
          .eq('jornada_id', id)
        const map = {}
        ;(data || []).forEach(s => {
          if (s.dia_jornada_id) map[s.dia_jornada_id] = (map[s.dia_jornada_id] || 0) + 1
        })
        setSesionesCountByDia(map)
      } catch {}
    }
  }

  return (
    <>
      {/* Topbar */}
      <div className="bg-white dark:bg-[#122A1C] border-b border-gray-100 dark:border-emerald-900/40 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-14 lg:top-0 z-10">
        <div>
          <h1 className="font-black text-xl text-gray-900 dark:text-gray-100 tracking-tight">Configuración de jornadas</h1>
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">
            {jornadas.length} Eventos en el historial
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1B4332] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#002F1D] hover:-translate-y-0.5 transition-all shadow-lg shadow-emerald-900/10"
        >
          <Plus className="w-4 h-4" strokeWidth={3} /> Nueva Jornada
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Info banner */}
        {showInfoBanner && (
          <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl p-6 mb-8 flex items-center gap-4 shadow-sm relative">
            <div className="w-10 h-10 bg-white dark:bg-emerald-800 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-[#1B4332] dark:text-emerald-100 leading-relaxed pr-8">
              Solo puede haber una jornada activa a la vez. La jornada activa es la que se muestra en la vista pública y controla el acceso a las inscripciones.
            </p>
            <button
              onClick={() => setShowInfoBanner(false)}
              className="absolute top-4 right-4 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors p-1"
              aria-label="Cerrar aviso"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Listado con diseño Premium */}
          <div className="bg-white dark:bg-[#122A1C] rounded-[32px] shadow-sm border border-gray-100 dark:border-emerald-900/40 overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center gap-2 px-8 pt-6 border-b border-gray-50 dark:border-emerald-900/30 overflow-x-auto scrollbar-hide">
            {TABS.map(tab => {
              const isActive = tabActivo === tab
              const count = tab === 'Todas' ? null : jornadas.filter(j =>
                (tab === 'Activas' && j.estado === 'activa') ||
                (tab === 'Finalizadas' && j.estado === 'finalizada') ||
                (tab === 'Borradores' && j.estado === 'borrador')
              ).length
              
              return (
                <button
                  key={tab}
                  onClick={() => setTabActivo(tab)}
                  className={`px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 whitespace-nowrap
                    ${isActive ? 'border-[#1B4332] text-[#1B4332]' : 'border-transparent text-gray-500 hover:text-gray-500'}`}
                >
                  {tab}
                  {count !== null && (
                    <span className={`ml-2 px-2 py-0.5 rounded-lg ${isActive ? 'bg-emerald-50 text-[#1B4332]' : 'bg-gray-50 text-gray-400'}`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-50 dark:bg-emerald-900/20 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-emerald-900/40">
                    {['Jornada', 'Fechas', 'Sede', 'Estado', 'Acciones'].map(h => (
                      <th key={h} className="text-left px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {jornadasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                        <div className="flex flex-col items-center opacity-30 dark:opacity-50">
                          <Plus className="w-16 h-16 text-[#1B4332] dark:text-emerald-600 mb-4" />
                          <p className="font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest text-sm">Sin resultados para esta categoría</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    jornadasFiltradas.map((j) => (
                      <React.Fragment key={j.id}>
                        <tr className={`group hover:bg-emerald-50/20 dark:hover:bg-emerald-900/10 transition-all ${expandedId === j.id ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''}`}>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white dark:bg-[#122A1C] rounded-2xl border border-gray-100 dark:border-emerald-900/40 flex items-center justify-center font-black text-[#1B4332] dark:text-emerald-400 text-sm shadow-sm group-hover:scale-110 transition-transform">
                                {j.edicion}
                              </div>
                              <div>
                                <p className="font-black text-gray-900 dark:text-gray-100 text-sm group-hover:text-[#1B4332] dark:group-hover:text-emerald-400 transition-colors">{j.nombre}</p>
                                {j.lema && <p className="text-[10px] font-bold text-gray-400 italic line-clamp-1">"{j.lema}"</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="w-4 h-4 text-emerald-600" />
                              <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase">{formatFechas(j.fecha_inicio, j.fecha_fin)}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase">{j.sede}</span>
                          </td>
                          <td className="px-8 py-6">
                            <StatusBadge estado={j.estado} />
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => toggleExpanded(j.id)}
                                className={`p-2.5 rounded-xl border transition-all ${expandedId === j.id ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'bg-white dark:bg-[#122A1C] text-gray-400 dark:text-gray-500 border-gray-100 dark:border-emerald-900/40 hover:text-[#1B4332] dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'}`}
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => handleOpenEdit(j)}
                                className="p-2.5 bg-white dark:bg-[#122A1C] text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-emerald-900/40 rounded-xl hover:text-[#1B4332] dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all"
                              >
                                <Edit2 className="w-5 h-5" />
                              </button>
                              {j.estado !== 'activa' && (
                                <button 
                                  onClick={() => handleDeleteClick(j)}
                                  className="p-2.5 bg-white dark:bg-[#122A1C] text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-emerald-900/40 rounded-xl hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expandedId === j.id && (
                          <tr className="bg-emerald-50/30 dark:bg-emerald-900/10">
                            <td colSpan={5} className="px-8 pb-8 pt-2">
                              <div className="bg-white dark:bg-[#122A1C] rounded-3xl p-8 shadow-sm border border-emerald-100/50 dark:border-emerald-900/40">
                                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-6">Programación de días</h4>
                                {(j.dias_jornada || []).length === 0 ? (
                                  <p className="text-xs font-bold text-gray-400 italic">No hay días generados para esta jornada.</p>
                                ) : (
                                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4">
                                    {(j.dias_jornada || [])
                                      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
                                      .map((dia, idx) => (
                                        <div key={dia.id} className="bg-gray-50/50 dark:bg-emerald-950/50 border border-gray-100 dark:border-emerald-900/50 rounded-2xl p-4 text-center relative group/day">
                                          <button
                                            onClick={() => handleDiaDeleted(dia.id)}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover/day:opacity-100 transition-all shadow-lg flex items-center justify-center"
                                          >
                                            <X className="w-3.5 h-3.5" strokeWidth={3} />
                                          </button>
                                          <p className="text-[10px] font-black text-gray-300 dark:text-gray-600 mb-1">DÍA {idx + 1}</p>
                                          <p className="text-sm font-black text-[#1B4332] dark:text-emerald-400 uppercase">{dia.nombre_dia}</p>
                                          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{new Date(dia.fecha + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</p>
                                          <div className="mt-2 flex items-center justify-center gap-1">
                                            <Sparkles size={10} className="text-emerald-500" />
                                            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400">
                                              {sesionesCountByDia[dia.id] || 0} sesiones
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <JornadaModal
          jornadaActiva={jornadaActiva}
          jornadaEditando={jornadaEditando}
          onClose={handleCloseModal}
          onSaved={handleSaved}
        />
      )}

      {showDeleteModal && jornadaAEliminar && (
        <DeleteModal
          jornada={jornadaAEliminar}
          onClose={handleDeleteClose}
          onConfirm={handleDeleteConfirm}
          deleting={deleting}
        />
      )}

      {toast && (
        <div className="fixed bottom-8 left-4 right-4 sm:left-auto sm:right-8 z-50 bg-[#1B4332] text-white px-8 py-4 rounded-2xl shadow-2xl font-black text-sm flex items-center gap-3 animate-slide-up">
          <Check className="w-5 h-5" strokeWidth={4} />
          {toast}
        </div>
      )}
    </>
  )
}
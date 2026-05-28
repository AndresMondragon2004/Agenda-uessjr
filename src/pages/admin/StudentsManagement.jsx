import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { X, Search, Trash2, Users, Edit2, Save, Loader2, Filter, CalendarDays, Calendar, Clock, ChevronRight, ChevronLeft, Check, ArrowRight, Megaphone, Download } from 'lucide-react'
import { estudiantesService } from '../../services/estudiantes.service'
import { norm } from '../../utils/search'

const PROGRAMA_LABELS = {
  sistemas:            'Ing. sistemas',
  innovacion_agricola: 'Ing. innovación',
  contaduria:          'Contaduría',
  docente:             'Docente',
  externo:             'Externo',
}

const PROGRAMA_COLORS = {
  sistemas:            'bg-blue-100 text-blue-800',
  innovacion_agricola: 'bg-green-100 text-green-800',
  contaduria:          'bg-purple-100 text-purple-800',
  docente:             'bg-amber-100 text-amber-800',
  externo:             'bg-gray-100 text-gray-600',
}

const PROGRAMAS_OPTIONS = [
  { value: 'sistemas',            label: 'Ing. sistemas' },
  { value: 'innovacion_agricola', label: 'Ing. innovación agrícola' },
  { value: 'contaduria',          label: 'Contaduría' },
  { value: 'docente',             label: 'Docente' },
]

// ─── View Detail Modal ───────────────────────────────────────────────────
function ViewEstudianteModal({ estudiante, onClose, onEdit, onDelete, loadingDetalle }) {
  const navigate = useNavigate()
  if (!estudiante) return null

  const getInitials = (n, a) => ((n?.[0] || '') + (a?.[0] || '')).toUpperCase() || '?'

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF9F6] dark:bg-[#122A1C] rounded-3xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-emerald-900/40 flex items-center justify-between bg-gray-50/50 dark:bg-[#0F2018]/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-white flex items-center justify-center shadow-lg shadow-emerald-900/20 font-black text-xl">
              {getInitials(estudiante.nombre, estudiante.apellidos)}
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 leading-tight">Perfil del estudiante</h2>
              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-1">Expediente académico</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-[#FAF9F6] dark:hover:bg-emerald-900/30 transition-all shadow-sm">
            <X size={20} />
          </button>
        </div>

        {loadingDetalle ? (
          <div className="p-20 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-[#1B4332] mx-auto mb-4" />
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Cargando historial...</p>
          </div>
        ) : (
          <div className="p-8 sm:p-10 space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Información Personal */}
              <div className="lg:col-span-5 space-y-8">
                <div>
                  <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 leading-tight mb-2">
                    {estudiante.nombre}
                    <span className="block text-gray-400 font-medium">{estudiante.apellidos}</span>
                  </h1>
                  <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border mt-2
                    ${PROGRAMA_COLORS[estudiante.programa_academico] || 'bg-gray-100 text-gray-600'}`}>
                    {PROGRAMA_LABELS[estudiante.programa_academico] || 'General'}
                  </span>
                </div>

                <div className="bg-gray-50 dark:bg-[#0F2018] rounded-3xl p-6 border border-gray-100 dark:border-emerald-900/30 space-y-5">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Correo Electrónico</span>
                    <a href={`mailto:${estudiante.correo}`} className="text-sm font-bold text-[#1B4332] dark:text-emerald-400 hover:underline">
                      {estudiante.correo}
                    </a>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">ID de Telegram</span>
                    <span className="text-sm font-black text-gray-800 dark:text-gray-200">{estudiante.telefono || 'No registrado'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Matrícula Escolar</span>
                    <span className="text-sm font-black text-gray-800 dark:text-gray-200">{estudiante.matricula || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Agenda / Inscripciones */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <CalendarDays size={14} className="text-emerald-500" /> Agenda Personal
                  </h4>
                  <span className="px-2.5 py-0.5 bg-[#1B4332] text-white text-[9px] font-black rounded-full uppercase">
                    {estudiante.inscripciones?.length || 0} sesiones
                  </span>
                </div>

                <div className="bg-gray-50/50 dark:bg-[#0F2018]/50 rounded-3xl p-2 border border-gray-100 dark:border-emerald-900/20 min-h-[200px]">
                  {(estudiante.inscripciones?.length || 0) === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 opacity-30">
                      <Calendar className="w-12 h-12 mb-3 text-gray-400" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Sin inscripciones registradas</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide p-2">
                      {estudiante.inscripciones.map(insc => {
                        const ses = insc.sesiones
                        if (!ses) return null
                        return (
                          <div 
                            key={insc.id} 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/sesiones/${ses.id}`);
                            }}
                            className="p-4 bg-[#FAF9F6] dark:bg-[#122A1C] rounded-2xl border border-gray-100 dark:border-emerald-900/30 shadow-sm hover:border-[#1B4332]/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-all flex items-center justify-between gap-4 cursor-pointer group/item"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-gray-800 dark:text-gray-200 leading-snug truncate group-hover/item:text-[#1B4332] dark:group-hover/item:text-emerald-400 transition-colors">{ses.nombre}</p>
                              <div className="flex items-center gap-3 text-[9px] font-bold text-gray-400 mt-1 uppercase">
                                <span className="flex items-center gap-1"><Calendar size={10} /> {ses.dias_jornada?.nombre_dia}</span>
                                <span className="flex items-center gap-1"><Clock size={10} /> {ses.hora_inicio?.slice(0, 5)}</span>
                              </div>
                            </div>
                            <ArrowRight size={14} className="text-emerald-500 shrink-0 group-hover/item:translate-x-1 transition-transform" />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer: Acciones */}
            <div className="pt-10 border-t border-gray-100 dark:border-emerald-900/40 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button onClick={() => onEdit(estudiante)} className="px-6 py-3 bg-gray-100 dark:bg-[#0F2018] text-gray-600 dark:text-gray-300 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-emerald-900/40 active:scale-95 transition-all">
                  Editar Datos
                </button>
                <button onClick={() => onDelete(estudiante)} className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl hover:bg-red-100 active:scale-95 transition-all">
                  <Trash2 size={20} />
                </button>
              </div>
              <button onClick={onClose} className="px-8 py-3 text-gray-400 text-[11px] font-black uppercase tracking-widest hover:text-gray-600 active:scale-95 transition-all">
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Edit Modal ───────────────────────────────────────────────────────────
function EditModal({ estudiante, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre:             estudiante.nombre || '',
    apellidos:          estudiante.apellidos || '',
    matricula:          estudiante.matricula || '',
    correo:             estudiante.correo || '',
    telefono:           estudiante.telefono || '',
    programa_academico: estudiante.programa_academico || '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim() || !form.apellidos.trim()) {
      setError('El nombre y apellidos son requeridos')
      return
    }
    try {
      setSaving(true)
      const updated = await estudiantesService.update(estudiante.id, form)
      onSaved(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF9F6] dark:bg-[#122A1C] rounded-2xl shadow-2xl w-full max-w-2xl my-8 animate-scale-in">
        <div className="flex items-center justify-between p-8 border-b border-gray-100 dark:border-emerald-900/40">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Editar estudiante</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-emerald-900/30 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {error && (
          <div className="mx-8 mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-lg">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nombre *</label>
              <input type="text" name="nombre" value={form.nombre} onChange={handleChange}
                className="w-full py-2 border-0 border-b border-gray-200 dark:border-emerald-900/40 text-sm bg-transparent dark:text-gray-200 outline-none focus:border-b-[#1B4332] transition-colors" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Apellidos *</label>
              <input type="text" name="apellidos" value={form.apellidos} onChange={handleChange}
                className="w-full py-2 border-0 border-b border-gray-200 dark:border-emerald-900/40 text-sm bg-transparent dark:text-gray-200 outline-none focus:border-b-[#1B4332] transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Telegram ID / Teléfono</label>
            <input type="text" name="telefono" value={form.telefono} onChange={handleChange}
              className="w-full py-2 border-0 border-b border-gray-200 dark:border-emerald-900/40 text-sm bg-transparent dark:text-gray-200 outline-none focus:border-b-[#1B4332] transition-colors" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Matrícula</label>
            <input type="text" name="matricula" value={form.matricula} onChange={handleChange}
              className="w-full py-2 border-0 border-b border-gray-200 text-sm bg-transparent outline-none focus:border-b-[#1B4332] transition-colors" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Correo electrónico</label>
            <input type="email" name="correo" value={form.correo} onChange={handleChange}
              className="w-full py-2 border-0 border-b border-gray-200 text-sm bg-transparent outline-none focus:border-b-[#1B4332] transition-colors" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Programa académico</label>
            <select name="programa_academico" value={form.programa_academico} onChange={handleChange}
              className="w-full py-2 border-0 border-b border-gray-200 dark:border-emerald-900/40 text-sm bg-transparent dark:text-gray-200 outline-none focus:border-b-[#1B4332] transition-colors">
              <option value="">Sin especificar</option>
              {PROGRAMAS_OPTIONS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-gray-700 dark:text-gray-300 font-semibold border border-gray-300 dark:border-emerald-900/40 rounded-xl hover:bg-gray-50 dark:hover:bg-emerald-900/20 active:scale-95 transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white font-semibold rounded-xl hover:from-[#133124] hover:to-[#1B4332] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Save className="w-4 h-4" /> Guardar</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Add Student Modal ───────────────────────────────────────────────────
function AddEstudianteModal({ onClose, onSaved }) {
  const [formData, setFormData] = useState({
    nombre: '', apellidos: '', matricula: '', correo: '', programa_academico: 'sistemas', telefono: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError(null)
      const newEstudiante = await estudiantesService.create(formData)
      onSaved(newEstudiante)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#122A1C] rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-scale-in">
        <div className="p-6 border-b border-gray-100 dark:border-emerald-900/40 flex items-center justify-between">
          <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">Registrar Estudiante</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nombre(s)</label>
              <input required value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                     className="w-full px-4 py-2 bg-gray-50 dark:bg-emerald-950/30 border border-gray-100 dark:border-emerald-900/40 rounded-xl text-sm font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#1B4332] dark:focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Apellidos</label>
              <input required value={formData.apellidos} onChange={e => setFormData({ ...formData, apellidos: e.target.value })}
                     className="w-full px-4 py-2 bg-gray-50 dark:bg-emerald-950/30 border border-gray-100 dark:border-emerald-900/40 rounded-xl text-sm font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#1B4332] dark:focus:border-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Correo Electrónico</label>
            <input required type="email" value={formData.correo} onChange={e => setFormData({ ...formData, correo: e.target.value })}
                   className="w-full px-4 py-2 bg-gray-50 dark:bg-emerald-950/30 border border-gray-100 dark:border-emerald-900/40 rounded-xl text-sm font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#1B4332] dark:focus:border-emerald-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Matrícula</label>
              <input value={formData.matricula} onChange={e => setFormData({ ...formData, matricula: e.target.value })}
                     className="w-full px-4 py-2 bg-gray-50 dark:bg-emerald-950/30 border border-gray-100 dark:border-emerald-900/40 rounded-xl text-sm font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#1B4332] dark:focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Teléfono (Telegram)</label>
              <input value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                     className="w-full px-4 py-2 bg-gray-50 dark:bg-emerald-950/30 border border-gray-100 dark:border-emerald-900/40 rounded-xl text-sm font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#1B4332] dark:focus:border-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Programa</label>
            <select value={formData.programa_academico} onChange={e => setFormData({ ...formData, programa_academico: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-emerald-950/30 border border-gray-100 dark:border-emerald-900/40 rounded-xl text-sm font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#1B4332] dark:focus:border-emerald-500">
              {PROGRAMAS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              <option value="externo">Externo</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 p-6 bg-gray-50 dark:bg-emerald-900/20 border-t border-gray-100 dark:border-emerald-900/40">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-emerald-900/40 rounded-xl transition-all uppercase tracking-widest text-xs">Cancelar</button>
          <button type="submit" disabled={saving} className="px-8 py-2.5 bg-[#1B4332] text-white font-black hover:bg-emerald-800 rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2 uppercase tracking-widest text-xs">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
            Guardar Estudiante
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Delete Modal ────────────────────────────────────────────────────────
function DeleteModal({ estudiante, onClose, onConfirm, deleting }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF9F6] dark:bg-[#122A1C] rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-scale-in">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">¿Eliminar este estudiante?</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
          Se eliminará <strong>"{estudiante.nombre} {estudiante.apellidos}"</strong>.
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mb-6">
          También se eliminarán todas sus inscripciones a sesiones.
        </p>
        <div className="space-y-3">
          <button type="button" onClick={onConfirm} disabled={deleting}
            className="w-full py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-red-900/20">
            {deleting ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
          <button type="button" onClick={onClose}
            className="w-full py-2.5 text-gray-700 dark:text-gray-300 font-semibold border border-gray-300 dark:border-emerald-900/40 rounded-lg hover:bg-gray-50 dark:hover:bg-emerald-900/20 active:scale-95 transition-all">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Utils ───────────────────────────────────────────────────────────────


function getInitials(nombre, apellidos) {
  return ((nombre?.[0] || '') + (apellidos?.[0] || '')).toUpperCase() || '?'
}

export default function StudentsManagement() {
  const navigate = useNavigate()
  const location = useLocation()
  const [estudiantes,             setEstudiantes]             = useState([])
  const [loading,                 setLoading]                 = useState(true)
  const [error,                   setError]                   = useState(null)
  const [busqueda,                setBusqueda]                = useState('')
  const [programaFiltro,          setProgramaFiltro]          = useState('todos')
  const [estudianteSeleccionado,  setEstudianteSeleccionado]  = useState(null)
  const [showViewModal,           setShowViewModal]           = useState(false)
  const [loadingDetalle,          setLoadingDetalle]          = useState(false)
  const [showDeleteModal,         setShowDeleteModal]         = useState(false)
  const [estudianteAEliminar,     setEstudianteAEliminar]     = useState(null)
  const [deleting,                setDeleting]                = useState(false)
  const [showEditModal,           setShowEditModal]           = useState(false)
  const [estudianteAEditar,       setEstudianteAEditar]       = useState(null)
  const [showAddModal,            setShowAddModal]            = useState(false)
  const [toast,                   setToast]                   = useState(null)
  const [currentPage,             setCurrentPage]             = useState(1)
  const itemsPerPage = 20

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2000) }

  const cargar = async () => {
    try {
      setLoading(true)
      const data = await estudiantesService.getAll()
      setEstudiantes(data || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [busqueda, programaFiltro])

  // ─── Detect and open student from navigation state ─────────────────────
  useEffect(() => {
    if (location.state?.selectedStudentId && estudiantes.length > 0) {
      const targetId = location.state.selectedStudentId
      const est = estudiantes.find(e => e.id === targetId)
      if (est) {
        handleSelectEstudiante(est)
        // Clean state so it doesn't re-open on reload
        navigate(location.pathname, { replace: true, state: {} })
      }
    }
  }, [location.state, estudiantes])

  const estudiantesFiltrados = useMemo(() => {
    return estudiantes
      .filter(e => programaFiltro === 'todos' || e.programa_academico === programaFiltro)
      .filter(e => {
        if (!busqueda) return true
        const q = norm(busqueda)
        return norm(e.nombre).includes(q) ||
          norm(e.apellidos).includes(q) ||
          norm(e.matricula).includes(q) ||
          norm(e.correo).includes(q) ||
          norm(PROGRAMA_LABELS[e.programa_academico] || '').includes(q)
      })
  }, [estudiantes, programaFiltro, busqueda])

  const currentEstudiantes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return estudiantesFiltrados.slice(start, start + itemsPerPage)
  }, [estudiantesFiltrados, currentPage])

  const totalPages = Math.ceil(estudiantesFiltrados.length / itemsPerPage)

  const handleSelectEstudiante = async (est) => {
    try {
      setEstudianteSeleccionado(est)
      setShowViewModal(true)
      setLoadingDetalle(true)
      const detalle = await estudiantesService.getById(est.id)
      setEstudianteSeleccionado(detalle)
    } catch (err) {
      setEstudianteSeleccionado(est)
    } finally {
      setLoadingDetalle(false)
    }
  }

  const handleEditFromView = (e) => {
    setShowViewModal(false)
    setEstudianteAEditar(e)
    setShowEditModal(true)
  }

  const handleEditSaved = (updated) => {
    setEstudiantes(prev => prev.map(e => e.id === updated.id ? { ...e, ...updated } : e))
    if (estudianteSeleccionado?.id === updated.id)
      setEstudianteSeleccionado(prev => ({ ...prev, ...updated }))
    setShowEditModal(false)
    setEstudianteAEditar(null)
    showToast('Datos del estudiante actualizados')
  }

  const handleDeleteFromView = (e) => {
    setShowViewModal(false)
    setEstudianteAEliminar(e)
    setShowDeleteModal(true)
  }

  const handleAddSaved = (newEst) => {
    setEstudiantes([newEst, ...estudiantes])
    setShowAddModal(false)
    showToast('Estudiante registrado con éxito')
  }

  const handleDeleteClose = () => { setShowDeleteModal(false); setEstudianteAEliminar(null) }
  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true)
      await estudiantesService.delete(estudianteAEliminar.id)
      if (estudianteSeleccionado?.id === estudianteAEliminar.id) setEstudianteSeleccionado(null)
      handleDeleteClose()
      cargar()
      showToast('Estudiante eliminado')
    } catch (err) { setError(err.message) }
    finally { setDeleting(false) }
  }

  return (
    <>
      {/* Topbar */}
      <div className="bg-[#FAF9F6] dark:bg-[#122A1C] border-b border-gray-100 dark:border-emerald-900/40 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-14 lg:top-0 z-10">
        <h1 className="font-black text-xl text-gray-900 dark:text-gray-100 tracking-tight">Estudiantes registrados</h1>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-[#1B4332] dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/50">
            {estudiantesFiltrados.length} / {estudiantes.length}
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-[#1B4332] text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#1B4332] hover:bg-[#0F2018] active:scale-95 transition-all shadow-md">
            + Nuevo Estudiante
          </button>
          <button
            onClick={() => {
              if (estudiantesFiltrados.length === 0) return
              const headers = ['Nombre', 'Apellidos', 'Matrícula', 'Correo', 'Programa', 'Telegram ID']
              const rows = estudiantesFiltrados.map(e => [
                e.nombre || '',
                e.apellidos || '',
                e.matricula || '',
                e.correo || '',
                PROGRAMA_LABELS[e.programa_academico] || e.programa_academico || '',
                e.telegram_chat_id || '',
              ])
              const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
              const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `estudiantes-uessjr-${new Date().toISOString().slice(0,10)}.csv`
              a.click()
              URL.revokeObjectURL(url)
            }}
            title="Exportar lista filtrada como CSV"
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-[#0F2018] text-gray-500 dark:text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-100 dark:border-emerald-900/40 hover:bg-gray-100 dark:hover:bg-emerald-900/30 active:scale-95 transition-all"
          >
            <Download size={13} /> CSV
          </button>
          <button
            onClick={() => navigate('/admin/anuncios')}
            title="Enviar mensaje masivo"
            className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-[#D97706] rounded-xl text-[10px] font-black uppercase tracking-widest border border-orange-100 dark:border-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/40 active:scale-95 transition-all"
          >
            <Megaphone size={13} /> Anuncios
          </button>        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-xl font-medium">
            {error}
          </div>
        )}

        <div className="bg-[#FAF9F6] dark:bg-[#122A1C] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-emerald-900/40 flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, matrícula o correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-emerald-900/50 dark:bg-[#0F2018] dark:text-gray-300 dark:placeholder-gray-600 focus:border-[#1B4332] focus:ring-4 focus:ring-[#1B4332]/10 dark:focus:ring-emerald-500/10 outline-none transition-all duration-300 text-sm font-bold"
            />
          </div>
          <div className="relative shrink-0">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={programaFiltro}
              onChange={(e) => setProgramaFiltro(e.target.value)}
              className="pl-11 pr-10 py-3 rounded-xl border border-gray-200 dark:border-emerald-900/50 focus:border-[#1B4332] outline-none transition-all text-sm font-black bg-[#FAF9F6] dark:bg-[#0F2018] dark:text-gray-300 appearance-none cursor-pointer"
            >
              <option value="todos">Todos los programas</option>
              {Object.entries(PROGRAMA_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="bg-[#FAF9F6] dark:bg-[#122A1C] rounded-3xl p-6 border border-gray-100 dark:border-emerald-900/40 animate-pulse flex flex-col gap-4">
            <div className="h-10 bg-gray-200 dark:bg-emerald-900/30 rounded w-full mb-4"></div>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-emerald-900/20 rounded w-full"></div>
            ))}
          </div>
        ) : (
          <div className="bg-[#FAF9F6]/80 backdrop-blur-xl dark:bg-[#122A1C]/80 rounded-3xl border border-gray-100 dark:border-emerald-900/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-[#0F2018]/50 border-b border-gray-100 dark:border-emerald-900/40">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estudiante</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contacto</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Programa</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-emerald-900/30">
                  {currentEstudiantes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-24 text-center">
                        <Users className="w-16 h-16 text-gray-200 dark:text-emerald-900/50 mx-auto mb-4" />
                        <p className="font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest text-sm">No se encontraron resultados</p>
                      </td>
                    </tr>
                  ) : (
                    currentEstudiantes.map((est) => (
                      <tr 
                        key={est.id}
                        className="group hover:bg-white dark:hover:bg-emerald-900/10 transition-colors cursor-pointer"
                        onClick={() => handleSelectEstudiante(est)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-white flex items-center justify-center font-black text-xs shadow-md shadow-emerald-900/20 shrink-0">
                              {getInitials(est.nombre, est.apellidos)}
                            </div>
                            <div>
                              <p className="text-sm font-black text-gray-900 dark:text-gray-100 group-hover:text-[#1B4332] dark:group-hover:text-emerald-400 transition-colors">
                                {est.nombre} {est.apellidos}
                              </p>
                              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">{est.matricula || 'Sin matrícula'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{est.correo}</p>
                          <p className="text-[10px] font-semibold text-gray-400">{est.telefono || 'Sin teléfono'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${PROGRAMA_COLORS[est.programa_academico] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`}>
                            {PROGRAMA_LABELS[est.programa_academico] || 'General'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleSelectEstudiante(est) }}
                              className="p-2 rounded-xl text-[#1B4332] dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors border border-emerald-100 dark:border-emerald-900/30"
                              title="Ver perfil"
                            >
                              <ChevronRight size={16} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setEstudianteAEditar(est); setShowEditModal(true) }}
                              className="p-2 rounded-xl text-amber-600 dark:text-amber-500 bg-amber-50/50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors border border-amber-100 dark:border-amber-900/30"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setEstudianteAEliminar(est); setShowDeleteModal(true) }}
                              className="p-2 rounded-xl text-red-600 dark:text-red-500 bg-red-50/50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-red-100 dark:border-red-900/30"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 dark:border-emerald-900/40 flex items-center justify-between bg-gray-50/50 dark:bg-[#0F2018]/50">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:block">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, estudiantesFiltrados.length)} de {estudiantesFiltrados.length} estudiantes
                </p>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-gray-200 dark:border-emerald-900/40 text-gray-500 dark:text-gray-400 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-emerald-900/30 transition-colors bg-white dark:bg-[#122A1C]"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 px-3 uppercase tracking-widest">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-gray-200 dark:border-emerald-900/40 text-gray-500 dark:text-gray-400 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-emerald-900/30 transition-colors bg-white dark:bg-[#122A1C]"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showViewModal && estudianteSeleccionado && (
        <ViewEstudianteModal
          estudiante={estudianteSeleccionado}
          loadingDetalle={loadingDetalle}
          onClose={() => { setShowViewModal(false); setEstudianteSeleccionado(null) }}
          onEdit={handleEditFromView}
          onDelete={handleDeleteFromView}
        />
      )}

      {showEditModal && estudianteAEditar && (
        <EditModal
          estudiante={estudianteAEditar}
          onClose={() => { setShowEditModal(false); setEstudianteAEditar(null) }}
          onSaved={handleEditSaved}
        />
      )}

      {showDeleteModal && estudianteAEliminar && (
        <DeleteModal estudiante={estudianteAEliminar} onClose={handleDeleteClose} onConfirm={handleDeleteConfirm} deleting={deleting} />
      )}

      {showAddModal && (
        <AddEstudianteModal
          onClose={() => setShowAddModal(false)}
          onSaved={handleAddSaved}
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

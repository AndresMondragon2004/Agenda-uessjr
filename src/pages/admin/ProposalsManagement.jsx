import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ChevronRight, Search, Edit2, Save, Loader2, FileText, Phone, Calendar, ArrowLeft, Trash2, Check, AlertCircle, Clock, Users } from 'lucide-react'
import { propuestasService } from '../../services/propuestas.service'
import { supabase } from '../../services/supabase'

const ESTADO_COLORS = {
  pendiente:  'bg-amber-100 text-amber-800',
  contactada: 'bg-blue-100 text-blue-800',
  aprobada:   'bg-emerald-100 text-emerald-800',
  rechazada:  'bg-red-100 text-red-700',
}

const ESTADO_LABELS = {
  pendiente:  'Pendiente',
  contactada: 'Contactada',
  aprobada:   'Aprobada',
  rechazada:  'Rechazada',
}

const TIPO_LABELS = {
  conferencia: 'Conferencia',
  taller:      'Taller',
  cultural:    'Cultural',
  competencia: 'Competencia',
}

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
const PROGRAMAS_DIRIGIDO = ['Ing. Sistemas', 'Ing. Innovación Agrícola', 'Contaduría', 'Público general']

const TABS = [
  { key: 'todas',      label: 'Todas' },
  { key: 'pendiente',  label: 'Pendientes' },
  { key: 'contactada', label: 'Contactadas' },
  { key: 'aprobada',   label: 'Aprobadas' },
  { key: 'rechazada',  label: 'Rechazadas' },
]

// ─── View Detail Modal ───────────────────────────────────────────────────
function ViewPropuestaModal({ propuesta, onClose, onEdit, onDelete, onCambiarEstado, updatingEstado, navigate, isProgrammed }) {
  if (!propuesta) return null

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto backdrop-blur-sm">
      <div className="bg-white dark:bg-[#122A1C] rounded-3xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden anim-scale-in">
        <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-emerald-900/40 flex items-center justify-between bg-gray-50/50 dark:bg-[#0F2018]/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1B4332] text-white flex items-center justify-center shadow-lg shadow-emerald-900/20">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 leading-tight">Detalles de la propuesta</h2>
              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-1">Revisión administrativa</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-emerald-900/30 transition-all shadow-sm">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 sm:p-10 space-y-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${ESTADO_COLORS[propuesta.estado]}`}>
                  {ESTADO_LABELS[propuesta.estado]}
                </span>
                <span className="px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-[10px] font-black text-[#1B4332] dark:text-emerald-400 uppercase border border-emerald-100 dark:border-emerald-800/50">
                  {TIPO_LABELS[propuesta.tipo_actividad] || propuesta.tipo_actividad}
                </span>
                {isProgrammed && (
                  <span className="px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase border border-blue-200 dark:border-blue-800/50 flex items-center gap-1.5">
                    <CheckCircle2 size={12} /> Programada
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 leading-tight">
                {propuesta.titulo || 'Sin título definido'}
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-8">
              <section>
                <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Descripción de la actividad
                </h4>
                <div className="bg-gray-50/50 dark:bg-[#0F2018]/50 p-6 rounded-3xl border border-gray-100 dark:border-emerald-900/20">
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium italic">
                    "{propuesta.descripcion || 'Sin descripción proporcionada'}"
                  </p>
                </div>
              </section>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-white dark:bg-[#0F2018] border border-gray-100 dark:border-emerald-900/30 rounded-2xl shadow-sm">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Duración</span>
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-200">
                    <Clock size={14} className="text-emerald-500" />
                    {propuesta.duracion_estimada || '—'}
                  </div>
                </div>
                <div className="p-5 bg-white dark:bg-[#0F2018] border border-gray-100 dark:border-emerald-900/30 rounded-2xl shadow-sm">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Horario</span>
                  <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{propuesta.horario_preferido || '—'}</div>
                </div>
              </div>

              <section>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Público objetivo</h4>
                <div className="flex flex-wrap gap-2">
                  {(propuesta.dirigido_a || []).map((d, i) => (
                    <span key={i} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-[10px] font-black text-[#1B4332] dark:text-emerald-400 uppercase rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                      {d}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section>
                <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">Información del ponente</h4>
                <div className="bg-[#1B4332] dark:bg-[#0F2018] rounded-3xl p-6 text-white shadow-xl shadow-emerald-900/20">
                  <p className="text-lg font-black mb-1">{propuesta.nombre_completo}</p>
                  <p className="text-xs font-medium opacity-80 mb-6">{propuesta.correo}</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs font-bold bg-white/10 p-3 rounded-2xl">
                      <Phone size={14} /> {propuesta.telefono || 'Sin teléfono'}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold bg-white/10 p-3 rounded-2xl">
                      <Users size={14} /> {propuesta.relacion_institucion || 'Externo'}
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Disponibilidad</h4>
                <div className="flex flex-wrap gap-2">
                  {(propuesta.dias_disponibles || []).map((d, i) => (
                    <span key={i} className="px-4 py-2 bg-gray-100 dark:bg-[#0F2018] text-gray-600 dark:text-gray-300 rounded-2xl text-[10px] font-black uppercase border border-gray-200 dark:border-emerald-900/30">
                      {d}
                    </span>
                  ))}
                </div>
              </section>

              {propuesta.requiere_materiales && (
                <section className="bg-amber-50 dark:bg-amber-900/20 rounded-3xl p-6 border border-amber-100 dark:border-amber-900/30">
                  <h4 className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <AlertCircle size={14} /> Requerimientos especiales
                  </h4>
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-300 leading-relaxed">{propuesta.materiales_descripcion || 'No especificado'}</p>
                </section>
              )}
            </div>
          </div>

          <div className="pt-10 border-t border-gray-100 dark:border-emerald-900/40 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => onEdit(propuesta)} className="px-6 py-3 bg-gray-100 dark:bg-[#0F2018] text-gray-600 dark:text-gray-300 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-emerald-900/40 transition-all">
                Editar
              </button>
              <button onClick={() => onDelete(propuesta)} className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl hover:bg-red-100 transition-all">
                <Trash2 size={20} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              {(propuesta.estado === 'pendiente' || propuesta.estado === 'contactada') && (
                <>
                  {propuesta.estado === 'pendiente' && (
                    <button disabled={updatingEstado} onClick={() => onCambiarEstado(propuesta.id, 'contactada')}
                      className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100 dark:border-blue-900/40">
                      Contactar
                    </button>
                  )}
                  <button disabled={updatingEstado} onClick={() => onCambiarEstado(propuesta.id, 'rechazada')}
                    className="px-6 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100 dark:border-red-900/40">
                    Rechazar
                  </button>
                  <button disabled={updatingEstado} onClick={() => onCambiarEstado(propuesta.id, 'aprobada')}
                    className="px-8 py-3 bg-[#1B4332] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#002F1D] transition-all shadow-xl shadow-emerald-900/20">
                    Aprobar
                  </button>
                </>
              )}
              {propuesta.estado === 'aprobada' && (
                isProgrammed ? (
                  <div className="px-8 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-2">
                    <CheckCircle2 size={16} /> Actividad Programada
                  </div>
                ) : (
                  <button onClick={() => navigate(`/admin/sesiones/nueva?propuesta=${propuesta.id}`)}
                    className="px-8 py-3 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:shadow-xl hover:shadow-emerald-900/20 transition-all flex items-center gap-2">
                    <Calendar size={16} /> Programar Actividad
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Modal ───────────────────────────────────────────────────────────
function EditPropuestaModal({ propuesta, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre_completo:    propuesta.nombre_completo || '',
    correo:               propuesta.correo || '',
    telefono:             propuesta.telefono || '',
    relacion_institucion: propuesta.relacion_institucion || '',
    tipo_actividad:                 propuesta.tipo_actividad || '',
    titulo:               propuesta.titulo || '',
    descripcion:          propuesta.descripcion || '',
    duracion_estimada:             propuesta.duracion_estimada || '',
    horario_preferido:    propuesta.horario_preferido || '',
    dias_disponibles:     propuesta.dias_disponibles || [],
    dirigido_a:           propuesta.dirigido_a || [],
    requiere_materiales:  propuesta.requiere_materiales || false,
    materiales_descripcion: propuesta.materiales_descripcion || '',
    representa_institucion: propuesta.representa_institucion || false,
    nombre_institucion:   propuesta.nombre_institucion || '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const toggleArray = (field, val) => {
    setForm(prev => {
      const arr = prev[field] || []
      return { ...prev, [field]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre_completo.trim() || !form.titulo.trim()) {
      setError('El nombre del proponente y el título son requeridos')
      return
    }
    try {
      setSaving(true)
      const updated = await propuestasService.update(propuesta.id, form)
      onSaved(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-2xl w-full max-w-4xl my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-emerald-900/40">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Editar propuesta</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-emerald-900/30 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {error && <div className="mx-6 mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Datos del proponente</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nombre *</label>
                <input type="text" name="nombre_completo" value={form.nombre_completo} onChange={handleChange} className="w-full py-2 border-0 border-b border-gray-200 dark:border-emerald-900/40 text-sm bg-transparent dark:text-gray-200 outline-none focus:border-b-[#1B4332] transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Relación con la institución</label>
                <select name="relacion_institucion" value={form.relacion_institucion} onChange={handleChange} className="w-full py-2 border-0 border-b border-gray-200 dark:border-emerald-900/40 text-sm bg-transparent dark:text-gray-200 outline-none focus:border-b-[#1B4332] transition-colors">
                  <option value="">Sin especificar</option>
                  {['estudiante','egresado','docente','externo','empresa'].map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Correo</label>
                <input type="email" name="correo" value={form.correo} onChange={handleChange} className="w-full py-2 border-0 border-b border-gray-200 dark:border-emerald-900/40 text-sm bg-transparent dark:text-gray-200 outline-none focus:border-b-[#1B4332] transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Teléfono</label>
                <input type="tel" name="telefono" value={form.telefono} onChange={handleChange} className="w-full py-2 border-0 border-b border-gray-200 dark:border-emerald-900/40 text-sm bg-transparent dark:text-gray-200 outline-none focus:border-b-[#1B4332] transition-colors" />
              </div>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Sobre la actividad</p>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Título *</label>
                <input type="text" name="titulo" value={form.titulo} onChange={handleChange} className="w-full py-2 border-0 border-b border-gray-200 dark:border-emerald-900/40 text-sm bg-transparent dark:text-gray-200 outline-none focus:border-b-[#1B4332] transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-x-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tipo</label>
                  <select name="tipo_actividad" value={form.tipo_actividad} onChange={handleChange} className="w-full py-2 border-0 border-b border-gray-200 dark:border-emerald-900/40 text-sm bg-transparent dark:text-gray-200 outline-none focus:border-b-[#1B4332] transition-colors">
                    <option value="">Sin especificar</option>
                    {Object.entries(TIPO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Duración</label>
                  <input type="text" name="duracion_estimada" value={form.duracion_estimada} onChange={handleChange} placeholder="Ej. 1 hora, 2 horas" className="w-full py-2 border-0 border-b border-gray-200 dark:border-emerald-900/40 text-sm bg-transparent dark:text-gray-200 outline-none focus:border-b-[#1B4332] transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Descripción</label>
                <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={3} className="w-full py-2 border-0 border-b border-gray-200 text-sm bg-transparent outline-none focus:border-b-[#1B4332] transition-colors resize-none" />
              </div>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Disponibilidad</p>
            <div className="mb-4">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Días disponibles</label>
              <div className="flex flex-wrap gap-2">
                {DIAS_SEMANA.map(d => (
                  <button key={d} type="button" onClick={() => toggleArray('dias_disponibles', d)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${(form.dias_disponibles || []).includes(d) ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'bg-white dark:bg-[#0F2018] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-emerald-900/40 hover:border-[#1B4332] dark:hover:border-emerald-700'}`}>{d}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Horario preferido</label>
              <select name="horario_preferido" value={form.horario_preferido} onChange={handleChange} className="w-full py-2 border-0 border-b border-gray-200 dark:border-emerald-900/40 text-sm bg-transparent dark:text-gray-200 outline-none focus:border-b-[#1B4332] transition-colors">
                <option value="">Sin especificar</option>
                {['Mañana','Tarde','Cualquier horario'].map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Dirigido a</label>
            <div className="flex flex-wrap gap-2">
              {PROGRAMAS_DIRIGIDO.map(p => (
                <button key={p} type="button" onClick={() => toggleArray('dirigido_a', p)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${(form.dirigido_a || []).includes(p) ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' : 'bg-white dark:bg-[#0F2018] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-emerald-900/40 hover:border-emerald-400 dark:hover:border-emerald-700'}`}>{p}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="requiere_materiales" checked={form.requiere_materiales} onChange={handleChange} className="w-4 h-4 accent-[#1B4332]" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Requiere materiales</span>
            </label>
            {form.requiere_materiales && <textarea name="materiales_descripcion" value={form.materiales_descripcion} onChange={handleChange} rows={2} placeholder="Describe los materiales necesarios..." className="mt-3 w-full py-2 border-0 border-b border-gray-200 text-sm bg-transparent outline-none focus:border-b-[#1B4332] transition-colors resize-none" />}
          </div>
          <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-emerald-900/30">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-gray-700 dark:text-gray-300 font-semibold border border-gray-300 dark:border-emerald-900/40 rounded-xl hover:bg-gray-50 dark:hover:bg-emerald-900/20 transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#1B4332] text-white font-semibold rounded-xl hover:bg-emerald-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">{saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Save className="w-4 h-4" /> Guardar</>}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete Modal ──────────────────────────────────────────────────────────
function DeleteModal({ propuesta, onClose, onConfirm, deleting }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4"><span className="text-3xl">⚠️</span></div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">¿Eliminar esta propuesta?</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Se eliminará la propuesta de <strong>"{propuesta.nombre_completo}"</strong>. Esta acción no se puede deshacer.</p>
        <div className="space-y-3">
          <button type="button" onClick={onConfirm} disabled={deleting} className="w-full py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">{deleting ? 'Eliminando...' : 'Sí, eliminar'}</button>
          <button type="button" onClick={onClose} className="w-full py-2.5 text-gray-700 dark:text-gray-300 font-semibold border border-gray-300 dark:border-emerald-900/40 rounded-lg hover:bg-gray-50 dark:hover:bg-emerald-900/20 transition-colors">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `Hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `Hace ${days}d`
  return `Hace ${Math.floor(days / 7)} sem`
}

export default function ProposalsManagement() {
  const navigate = useNavigate()
  const [propuestas,             setPropuestas]             = useState([])
  const [loading,                setLoading]                = useState(true)
  const [error,                  setError]                  = useState(null)
  const [tabActivo,              setTabActivo]              = useState('todas')
  const [busqueda,               setBusqueda]              = useState('')
  const [propuestaSeleccionada,  setPropuestaSeleccionada]  = useState(null)
  const [showViewModal,          setShowViewModal]          = useState(false)
  const [showDeleteModal,        setShowDeleteModal]        = useState(false)
  const [propuestaAEliminar,     setPropuestaAEliminar]     = useState(null)
  const [deleting,               setDeleting]               = useState(false)
  const [updatingEstado,         setUpdatingEstado]         = useState(false)
  const [showEditModal,          setShowEditModal]          = useState(false)
  const [propuestaAEditar,       setPropuestaAEditar]       = useState(null)
  const [toast,                  setToast]                  = useState(null)
  const [selectedIds,            setSelectedIds]            = useState([])
  const [programmedIds,          setProgrammedIds]          = useState([])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2000) }

  const cargar = async () => {
    try {
      setLoading(true)
      const [data, sesiones] = await Promise.all([
        propuestasService.getAll(),
        supabase.from('sesiones').select('id') // Simplified check: we'll use a better one if possible
      ])
      
      // Intentar obtener sesiones con propuesta_id si existe la columna
      const { data: sesConProp } = await supabase.from('sesiones').select('propuesta_id')
      if (sesConProp) {
        setProgrammedIds(sesConProp.map(s => s.propuesta_id).filter(Boolean))
      }

      setPropuestas(data || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const propuestasFiltradas = propuestas
    .filter(p => tabActivo === 'todas' || p.estado === tabActivo)
    .filter(p => {
      if (!busqueda) return true
      const q = busqueda.toLowerCase()
      return (
        p.nombre_completo?.toLowerCase().includes(q) ||
        p.titulo?.toLowerCase().includes(q) ||
        p.correo?.toLowerCase().includes(q) ||
        p.descripcion?.toLowerCase().includes(q)
      )
    })

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      setUpdatingEstado(true)
      await propuestasService.updateEstado(id, nuevoEstado)
      await cargar()
      if (propuestaSeleccionada?.id === id) {
        setPropuestaSeleccionada(prev => ({ ...prev, estado: nuevoEstado }))
      }
      showToast(`Estado actualizado a "${ESTADO_LABELS[nuevoEstado]}"`)
    } catch (err) { setError(err.message) }
    finally { setUpdatingEstado(false) }
  }

  const handleViewClick = (p) => { setPropuestaSeleccionada(p); setShowViewModal(true) }

  const handleEditClickFromView = (p) => {
    setShowViewModal(false)
    setPropuestaAEditar(p)
    setShowEditModal(true)
  }

  const handleEditSaved = (updated) => {
    setPropuestas(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))
    if (propuestaSeleccionada?.id === updated.id) setPropuestaSeleccionada(prev => ({ ...prev, ...updated }))
    setShowEditModal(false)
    setPropuestaAEditar(null)
    showToast('Propuesta actualizada')
  }

  const handleDeleteClickFromView = (p) => {
    setShowViewModal(false)
    setPropuestaAEliminar(p)
    setShowDeleteModal(true)
  }

  const handleDeleteClose = () => { setShowDeleteModal(false); setPropuestaAEliminar(null) }
  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true)
      await propuestasService.delete(propuestaAEliminar.id)
      if (propuestaSeleccionada?.id === propuestaAEliminar.id) setPropuestaSeleccionada(null)
      handleDeleteClose()
      cargar()
      showToast('Propuesta eliminada')
    } catch (err) { setError(err.message) }
    finally { setDeleting(false) }
  }

  const countByEstado = (estado) => propuestas.filter(p => p.estado === estado).length

  const toggleSelect = (id, e) => {
    e.stopPropagation()
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleBulkUpdate = async (nuevoEstado) => {
    if (!window.confirm(`¿Seguro que deseas marcar ${selectedIds.length} propuestas como "${ESTADO_LABELS[nuevoEstado]}"?`)) return
    try {
      setUpdatingEstado(true)
      await Promise.all(selectedIds.map(id => propuestasService.updateEstado(id, nuevoEstado)))
      await cargar()
      setSelectedIds([])
      showToast(`${selectedIds.length} propuestas actualizadas`)
    } catch (err) { setError(err.message) }
    finally { setUpdatingEstado(false) }
  }

  return (
    <>
      <div className="bg-white dark:bg-[#122A1C] border-b border-gray-100 dark:border-emerald-900/40 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-14 lg:top-0 z-10">
        <h1 className="font-black text-xl text-gray-900 dark:text-gray-100 tracking-tight">Propuestas de actividad</h1>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-[#1B4332] dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/50">
            {propuestas.length} Total
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-xl font-medium">{error}</div>}

        <div className="space-y-4 mb-8">
          <div className="bg-white dark:bg-[#122A1C] rounded-2xl p-2 shadow-sm border border-gray-100 dark:border-emerald-900/40 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Buscar por nombre, título o correo..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-xl border border-transparent focus:bg-emerald-50/30 dark:focus:bg-emerald-900/20 bg-transparent dark:text-gray-100 dark:placeholder-gray-500 outline-none transition-all text-sm font-bold" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
            {TABS.map(tab => {
              const count = tab.key === 'todas' ? propuestas.length : countByEstado(tab.key)
              return (
                <button key={tab.key} onClick={() => setTabActivo(tab.key)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${tabActivo === tab.key ? 'bg-[#1B4332] text-white border-[#1B4332] shadow-lg shadow-emerald-900/10' : 'bg-white dark:bg-[#122A1C] text-gray-400 dark:text-gray-500 border-gray-100 dark:border-emerald-900/40 hover:border-emerald-100 dark:hover:border-emerald-800/50 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                  {tab.label}
                  <span className={`ml-2 px-1.5 py-0.5 rounded-lg ${tabActivo === tab.key ? 'bg-white/20' : 'bg-gray-100 dark:bg-emerald-900/30'}`}>{count}</span>
                </button>
              )
            })}
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1B4332] mx-auto mb-4" />
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Escaneando propuestas...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {propuestasFiltradas.length === 0 ? (
              <div className="lg:col-span-3 py-24 text-center bg-white dark:bg-[#122A1C] rounded-3xl border border-gray-100 dark:border-emerald-900/30 border-dashed">
                <FileText className="w-16 h-16 text-gray-200 dark:text-emerald-900/50 mx-auto mb-4" />
                <p className="font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest text-sm">Sin propuestas en esta bandeja</p>
              </div>
            ) : (
              propuestasFiltradas.map(p => {
                const isSelected = selectedIds.includes(p.id)
                return (
                  <div key={p.id} onClick={() => handleViewClick(p)} className={`bg-white dark:bg-[#122A1C] rounded-3xl p-6 border transition-all cursor-pointer group relative ${isSelected ? 'border-[#1B4332] shadow-xl ring-2 ring-[#1B4332]/10' : 'border-gray-100 dark:border-emerald-900/40 hover:border-emerald-200 dark:hover:border-emerald-700 hover:shadow-xl'}`}>
                    <div onClick={(e) => toggleSelect(p.id, e)} className={`absolute top-4 left-4 w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center z-10 ${isSelected ? 'bg-[#1B4332] border-[#1B4332]' : 'bg-white/80 dark:bg-[#0F2018]/80 border-gray-200 dark:border-emerald-900/40 opacity-0 group-hover:opacity-100'}`}>
                      {isSelected && <Check size={12} strokeWidth={4} className="text-white" />}
                    </div>
                    <div className={`flex items-start justify-between gap-4 mb-4 ${isSelected ? 'pl-4' : 'group-hover:pl-4'} transition-all`}>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-gray-900 dark:text-gray-100 text-sm group-hover:text-[#1B4332] dark:group-hover:text-emerald-400 transition-colors leading-snug mb-1 truncate">{p.titulo || 'Sin título'}</h3>
                        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 truncate">{p.nombre_completo}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shrink-0 ${ESTADO_COLORS[p.estado] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{ESTADO_LABELS[p.estado]}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-2 py-0.5 rounded-lg bg-gray-50 dark:bg-[#0F2018] text-gray-500 dark:text-gray-400 text-[9px] font-black uppercase border border-gray-100 dark:border-emerald-900/30">{TIPO_LABELS[p.tipo_actividad] || p.tipo_actividad}</span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-emerald-900/30">
                      <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600 uppercase">{timeAgo(p.created_at)}</span>
                      <div className="flex items-center gap-1.5 text-[#1B4332] dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">Detalles <ChevronRight className="w-3.5 h-3.5" /></div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {selectedIds.length > 0 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
            <div className="bg-[#1B4332] text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-6 border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-3 pr-6 border-r border-white/20">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm">{selectedIds.length}</div>
                <p className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">Seleccionados</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => handleBulkUpdate('contactada')} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Contactar todos</button>
                <button onClick={() => handleBulkUpdate('aprobada')} className="px-6 py-2 bg-amber-400 hover:bg-amber-300 text-[#1B4332] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Aprobar todos</button>
                <button onClick={() => setSelectedIds([])} className="p-2 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-all"><X size={18} /></button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showViewModal && propuestaSeleccionada && (
        <ViewPropuestaModal
          propuesta={propuestaSeleccionada}
          isProgrammed={programmedIds.includes(propuestaSeleccionada.id)}
          onClose={() => { setShowViewModal(false); setPropuestaSeleccionada(null) }}
          onEdit={handleEditClickFromView}
          onDelete={handleDeleteClickFromView}
          onCambiarEstado={handleCambiarEstado}
          updatingEstado={updatingEstado}
          navigate={navigate}
        />
      )}

      {showEditModal && propuestaAEditar && (
        <EditPropuestaModal propuesta={propuestaAEditar} onClose={() => { setShowEditModal(false); setPropuestaAEditar(null) }} onSaved={handleEditSaved} />
      )}

      {showDeleteModal && propuestaAEliminar && (
        <DeleteModal propuesta={propuestaAEliminar} onClose={handleDeleteClose} onConfirm={handleDeleteConfirm} deleting={deleting} />
      )}

      {toast && (
        <div className="fixed bottom-8 right-8 z-50 bg-[#1B4332] text-white px-8 py-4 rounded-2xl shadow-2xl font-black text-sm flex items-center gap-3 animate-slide-up">
          <Check className="w-5 h-5" strokeWidth={4} />
          {toast}
        </div>
      )}
    </>
  )
}

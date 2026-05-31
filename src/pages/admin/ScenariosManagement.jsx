import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit2, Trash2, X, MapPin, Check } from 'lucide-react'
import { escenariosService } from '../../services/escenarios.service'
import { sesionesService } from '../../services/sesiones.service'
import { jornadaService } from '../../services/jornada.service'



// (Rediseño premium: referencias a monarca eliminadas)

const TIPO_STYLES = {
  interior:    'bg-blue-50   text-blue-700',
  exterior:    'bg-green-50  text-green-700',
  laboratorio: 'bg-purple-50 text-purple-700',
  auditorio:   'bg-amber-50  text-amber-700',
}

const FORM_DEFAULT = {
  nombre:           '',
  descripcion:      '',
  capacidad_maxima: '',
  tipo:             'interior',
  disponible:       true,
}

// ─── ToggleSwitch ──────────────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, label, hint }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-emerald-900/30">
      <div>
        <span className="text-sm text-gray-700 dark:text-gray-200 font-bold">{label}</span>
        {hint && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-all duration-300 shrink-0 ml-4 border-2
          ${checked ? 'bg-[#1B4332] border-[#1B4332]' : 'bg-gray-200 dark:bg-emerald-950/50 border-gray-200 dark:border-emerald-900/50'}`}
      >
        <span className={`absolute top-0.5 left-0.5 bg-white rounded-full
          transition-all duration-300 shadow-sm
          ${checked ? 'translate-x-5' : 'translate-x-0'}`} 
          style={{ width: '16px', height: '16px' }}
        />
      </button>
    </div>
  )
}





function EscenarioModal({ escenarioEditando, onClose, onSaved }) {
  const [form, setForm] = useState(
    escenarioEditando
      ? {
          nombre:           escenarioEditando.nombre,
          descripcion:      escenarioEditando.descripcion || '',
          capacidad_maxima: escenarioEditando.capacidad_maxima,
          tipo:             escenarioEditando.tipo,
          disponible:       escenarioEditando.disponible,
        }
      : { ...FORM_DEFAULT }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)
  const isEditing           = !!escenarioEditando

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre || !form.capacidad_maxima) {
      setError('El nombre y la capacidad máxima son obligatorios.')
      return
    }
    const payload = { ...form, capacidad_maxima: parseInt(form.capacidad_maxima, 10) }
    try {
      setSaving(true)
      setError(null)
      if (isEditing) {
        await escenariosService.update(escenarioEditando.id, payload)
      } else {
        await escenariosService.create(payload)
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {isEditing ? 'Editar escenario' : 'Crear nuevo escenario'}
          </h2>
          <button type="button" onClick={onClose} className="p-1 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-emerald-900/30 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre del escenario *
            </label>
            <input name="nombre" value={form.nombre} onChange={handleChange}
              placeholder="Ej. Aula Magna"
              className="w-full px-4 py-2 border border-gray-200 dark:border-emerald-900/40 rounded-xl focus:border-[#004F31] focus:ring-1 focus:ring-[#004F31] outline-none transition-shadow bg-white dark:bg-[#0F2018] text-gray-900 dark:text-gray-200" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción <span className="text-gray-400 dark:text-gray-500 font-normal">(opcional)</span>
            </label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
              rows={3} placeholder="Describe las características del espacio..."
              className="w-full px-4 py-2 border border-gray-200 dark:border-emerald-900/40 rounded-xl focus:border-[#004F31] focus:ring-1 focus:ring-[#004F31] outline-none resize-none transition-shadow bg-white dark:bg-[#0F2018] text-gray-900 dark:text-gray-200" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Capacidad máxima *
              </label>
              <input type="number" name="capacidad_maxima" min="1"
                value={form.capacidad_maxima} onChange={handleChange}
                placeholder="Ej. 200"
                className="w-full px-4 py-2 border border-gray-200 dark:border-emerald-900/40 rounded-xl focus:border-[#004F31] focus:ring-1 focus:ring-[#004F31] outline-none transition-shadow bg-white dark:bg-[#0F2018] text-gray-900 dark:text-gray-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de espacio
              </label>
              <select name="tipo" value={form.tipo} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 dark:border-emerald-900/40 rounded-xl focus:border-[#004F31] focus:ring-1 focus:ring-[#004F31] outline-none transition-shadow bg-white dark:bg-[#0F2018] text-gray-900 dark:text-gray-200">
                <option value="interior">Interior</option>
                <option value="exterior">Exterior</option>
                <option value="laboratorio">Laboratorio</option>
                <option value="auditorio">Auditorio</option>
              </select>
            </div>
          </div>

          <ToggleSwitch
            label="Disponible por defecto"
            hint="Si está activo aparecerá disponible para sesiones"
            checked={form.disponible}
            onChange={val => setForm(p => ({ ...p, disponible: val }))}
          />

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
                    className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300
                               border border-gray-300 dark:border-emerald-900/40 rounded-lg hover:bg-gray-50 dark:hover:bg-emerald-900/20 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
                    className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-[#004F31]
                               rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar escenario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete Modal ──────────────────────────────────────────────────────────
function DeleteModal({ escenario, onClose, onConfirm, deleting }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">¿Eliminar este escenario?</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          Se eliminará <strong>"{escenario.nombre}"</strong>. Las sesiones asignadas
          a este escenario quedarán sin escenario.
        </p>
        <div className="space-y-3">
          <button type="button" onClick={onConfirm} disabled={deleting}
                  className="w-full py-2.5 bg-red-600 text-white font-semibold rounded-lg
                             hover:bg-red-700 transition-colors disabled:opacity-50">
            {deleting ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
          <button type="button" onClick={onClose}
                  className="w-full py-2.5 text-gray-700 dark:text-gray-300 font-semibold border border-gray-300 dark:border-emerald-900/40
                             rounded-lg hover:bg-gray-50 dark:hover:bg-emerald-900/20 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function ScenariosManagement() {
  const navigate = useNavigate()


  const [escenarios,         setEscenarios]         = useState([])
  const [loading,            setLoading]            = useState(true)
  const [error,              setError]              = useState(null)
  const [showModal,          setShowModal]          = useState(false)
  const [escenarioEditando,  setEscenarioEditando]  = useState(null)
  const [showDeleteModal,    setShowDeleteModal]    = useState(false)
  const [escenarioAEliminar, setEscenarioAEliminar] = useState(null)
  const [deleting,           setDeleting]           = useState(false)
  const [toast,              setToast]              = useState(null)
  const [showBanner,         setShowBanner]         = useState(true)
  const [sesionesCountMap,   setSesionesCountMap]   = useState({})
  const [inscritosMap,       setInscritosMap]       = useState({})

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  const cargarEscenarios = async () => {
    try {
      setLoading(true)
      const [escData, jornada] = await Promise.all([
        escenariosService.getAll(),
        jornadaService.getActiva().catch(() => null),
      ])
      setEscenarios(escData || [])

      if (jornada) {
        // getByJornada ya incluye total_inscritos por sesión
        const sesiones = await sesionesService.getByJornada(jornada.id)
        const sesCount = {}
        const inscCount = {}
        sesiones.forEach(s => {
          if (!s.escenario_id) return
          sesCount[s.escenario_id]  = (sesCount[s.escenario_id]  || 0) + 1
          inscCount[s.escenario_id] = (inscCount[s.escenario_id] || 0) + (s.total_inscritos || 0)
        })
        setSesionesCountMap(sesCount)
        setInscritosMap(inscCount)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargarEscenarios() }, [])

  const handleOpenCreate = () => { setEscenarioEditando(null);  setShowModal(true) }
  const handleOpenEdit   = (e) => { setEscenarioEditando(e);    setShowModal(true) }
  const handleCloseModal = () => { setShowModal(false); setEscenarioEditando(null) }
  const handleSaved      = () => { handleCloseModal(); cargarEscenarios(); showToast('Escenario guardado exitosamente') }

  const handleDeleteClick = (esc) => { setEscenarioAEliminar(esc); setShowDeleteModal(true) }
  const handleDeleteClose = () => { setShowDeleteModal(false); setEscenarioAEliminar(null) }

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true)
      await escenariosService.delete(escenarioAEliminar.id)
      handleDeleteClose()
      cargarEscenarios()
      showToast('Escenario eliminado')
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleDisponible = async (esc) => {
    try {
      await escenariosService.update(esc.id, { disponible: !esc.disponible })
      cargarEscenarios()
      showToast(esc.disponible ? 'Marcado como no disponible' : 'Marcado como disponible')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      {/* Topbar */}
      <div className="bg-white dark:bg-[#122A1C] border-b border-gray-100 dark:border-emerald-900/40 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-14 lg:top-0 z-10">
        <div>
          <h1 className="font-black text-xl text-gray-900 dark:text-gray-100 tracking-tight">Escenarios e instalaciones</h1>
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">
            {escenarios.length} Espacios Registrados
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1B4332] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#002F1D] hover:-translate-y-0.5 transition-all shadow-lg shadow-emerald-900/10"
        >
          <Plus className="w-4 h-4" strokeWidth={3} /> Nuevo Escenario
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Info banner */}
        {showBanner && (
          <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl p-6 mb-8 flex items-center justify-between gap-4 shadow-sm group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white dark:bg-emerald-800 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                <MapPin className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-[#1B4332] dark:text-emerald-100 leading-relaxed">
                Los escenarios se asignan al registrar cada sesión. El cupo máximo del escenario determina el límite de inscripciones automáticas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowBanner(false)}
              className="p-2 text-emerald-300 hover:text-emerald-600 transition-colors"
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

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-[#122A1C] rounded-3xl p-6 border border-gray-100 dark:border-emerald-900/40 animate-pulse space-y-4 shadow-sm">
                <div className="h-6 w-32 bg-gray-100 dark:bg-emerald-900/20 rounded" />
                <div className="h-20 w-full bg-gray-100 dark:bg-emerald-900/20 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {escenarios.map(esc => {
                const asignadas = sesionesCountMap[esc.id] || 0
                
                return (
                  <div key={esc.id} className="bg-white dark:bg-[#122A1C] rounded-[32px] p-8 border border-gray-100 dark:border-emerald-900/40 shadow-sm hover:shadow-2xl hover:shadow-emerald-900/5 transition-all flex flex-col group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-[64px] -z-10 group-hover:bg-emerald-100 transition-colors" />
                    
                    <div className="flex items-start justify-between mb-6">
                      <div className="space-y-1">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border
                          ${TIPO_STYLES[esc.tipo] || 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                          {esc.tipo}
                        </span>
                        <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 group-hover:text-[#1B4332] dark:group-hover:text-emerald-400 transition-colors">{esc.nombre}</h3>
                      </div>
                      <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm
                        ${esc.disponible ? 'bg-[#1B4332] text-white' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                        {esc.disponible ? 'Disponible' : 'Cerrado'}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-8 line-clamp-2 min-h-[40px]">
                      {esc.descripcion || 'Sin descripción adicional para este espacio.'}
                    </p>

                    <div className="bg-gray-50/80 dark:bg-[#0F2018]/80 rounded-2xl p-4 mb-8 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Aforo por sesión</p>
                        <p className="text-3xl font-black text-[#1B4332] dark:text-emerald-400 leading-none">{esc.capacidad_maxima}</p>
                        <p className="text-[9px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest mt-1">personas</p>
                      </div>
                      <div className="h-12 w-px bg-gray-200 dark:bg-emerald-900/40 shrink-0" />
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Sesiones</p>
                        <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{asignadas}</p>
                        <p className="text-[9px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest mt-1">programadas</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-gray-50 dark:border-emerald-900/30 mt-auto">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleDisponible(esc)}
                          className={`relative w-10 h-5 rounded-full transition-all border
                            ${esc.disponible ? 'bg-emerald-500 border-emerald-500' : 'bg-gray-200 dark:bg-emerald-950/50 border-gray-200 dark:border-emerald-900/50'}`}
                        >
                          <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all ${esc.disponible ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                          {esc.disponible ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleOpenEdit(esc)}
                          className="p-2.5 text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-emerald-900/40 rounded-xl hover:text-[#1B4332] dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-100 dark:hover:border-emerald-800/50 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(esc)}
                          className="p-2.5 text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-emerald-900/40 rounded-xl hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-100 dark:hover:border-red-900/30 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Add New Card */}
              <button
                onClick={handleOpenCreate}
                className="bg-gray-50/50 dark:bg-[#122A1C]/50 border-4 border-dashed border-gray-100 dark:border-emerald-900/40 rounded-[32px] p-8 flex flex-col items-center justify-center gap-4 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-100 dark:hover:border-emerald-800/50 hover:scale-[0.98] transition-all min-h-[350px] group"
              >
                <div className="w-16 h-16 bg-white dark:bg-[#122A1C] rounded-3xl flex items-center justify-center text-gray-200 dark:text-gray-700 group-hover:text-[#1B4332] dark:group-hover:text-emerald-400 group-hover:shadow-xl transition-all">
                  <Plus className="w-8 h-8" strokeWidth={3} />
                </div>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest group-hover:text-[#1B4332]">Añadir nuevo escenario</p>
              </button>
            </div>

            {escenarios.length === 0 && (
              <div className="py-24 text-center">
                <MapPin className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                <p className="font-black text-gray-900 uppercase tracking-widest text-sm">No hay escenarios registrados aún</p>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <EscenarioModal
          escenarioEditando={escenarioEditando}
          onClose={handleCloseModal}
          onSaved={handleSaved}
        />
      )}

      {showDeleteModal && escenarioAEliminar && (
        <DeleteModal
          escenario={escenarioAEliminar}
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

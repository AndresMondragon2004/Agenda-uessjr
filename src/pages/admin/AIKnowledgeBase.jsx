import { useState, useEffect } from 'react'
import { Brain, Plus, Search, Trash2, Save, X, MessageSquare, Info, Sparkles, Loader2, Check, Pencil } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { norm } from '../../utils/search'

export default function AIKnowledgeBase() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ pregunta: '', respuesta: '', categoria: 'general' })
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('conocimiento_ia')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setItems(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.pregunta || !form.respuesta) return
    
    try {
      setGuardando(true)
      if (editando) {
        const { error } = await supabase
          .from('conocimiento_ia')
          .update(form)
          .eq('id', editando.id)
        if (error) throw error
        showToast('Conocimiento actualizado')
      } else {
        const { error } = await supabase
          .from('conocimiento_ia')
          .insert([form])
        if (error) throw error
        showToast('Nuevo conocimiento añadido')
      }
      setShowModal(false)
      setEditando(null)
      setForm({ pregunta: '', respuesta: '', categoria: 'general' })
      fetchData()
    } catch (err) {
      alert(err.message)
    } finally {
      setGuardando(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este dato de la memoria de la IA?')) return
    try {
      const { error } = await supabase.from('conocimiento_ia').delete().eq('id', id)
      if (error) throw error
      setItems(prev => prev.filter(i => i.id !== id))
      showToast('Eliminado de la memoria')
    } catch (err) {
      alert(err.message)
    }
  }

  const filtered = items.filter(i =>
    norm(i.pregunta).includes(norm(busqueda)) ||
    norm(i.respuesta).includes(norm(busqueda)) ||
    norm(i.categoria).includes(norm(busqueda))
  )

  return (
    <div className="min-h-screen bg-[#F2F5F3] dark:bg-[#0A1A11] pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-[#122A1C] border-b border-gray-100 dark:border-emerald-900/40 px-4 sm:px-8 py-6 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center text-[#1B4332] dark:text-emerald-400 shadow-inner">
              <Brain size={24} />
            </div>
            <div>
              <h1 className="font-black text-xl text-gray-900 dark:text-gray-100 leading-none">Entrenamiento IA</h1>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1.5 flex items-center gap-1">
                <Sparkles size={10} /> Base de conocimientos
              </p>
            </div>
          </div>
          <button 
            onClick={() => { setEditando(null); setForm({ pregunta: '', respuesta: '', categoria: 'general' }); setShowModal(true) }}
            className="bg-[#1B4332] text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Entrenar nueva respuesta
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 mt-8">
        
        {/* Intro Card */}
        <div className="bg-gradient-to-br from-[#1B4332] to-[#0D2B1D] rounded-[2.5rem] p-8 text-white mb-8 relative overflow-hidden shadow-xl shadow-emerald-950/20">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <Brain size={180} />
          </div>
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-2xl font-black mb-3">La memoria de tu asistente</h2>
            <p className="text-emerald-100/70 text-sm leading-relaxed">
              Lo que escribas aquí será utilizado por el bot de Telegram para responder a los alumnos. 
              Puedes añadir información sobre logística, servicios del campus o reglas del evento que no están en la agenda oficial.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar en la memoria de la IA..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-[#122A1C] border border-gray-100 dark:border-emerald-900/30 rounded-2xl outline-none focus:border-[#1B4332] font-bold text-sm shadow-sm"
          />
        </div>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
             [1,2,3,4].map(i => <div key={i} className="h-32 bg-white dark:bg-[#122A1C] rounded-3xl animate-pulse border border-gray-100 dark:border-emerald-900/20" />)
          ) : filtered.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white dark:bg-[#122A1C] rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-emerald-900/20">
              <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-bold">No hay conocimientos registrados para este criterio</p>
            </div>
          ) : (
            filtered.map(item => (
              <div key={item.id} className="group bg-white dark:bg-[#122A1C] p-6 rounded-3xl border border-gray-100 dark:border-emerald-900/30 hover:shadow-xl transition-all relative">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/40 text-[#1B4332] dark:text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/30">
                    {item.categoria}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 opacity-100">
                    <button 
                      onClick={() => { setEditando(item); setForm({ pregunta: item.pregunta, respuesta: item.respuesta, categoria: item.categoria }); setShowModal(true) }}
                      className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 rounded-xl transition-all"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-xl transition-all"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-black text-gray-900 dark:text-gray-100 mb-2 leading-tight pr-10">{item.pregunta}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">{item.respuesta}</p>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal Entrenar */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <form onSubmit={handleSave} className="bg-white dark:bg-[#122A1C] w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-emerald-100 dark:border-emerald-900/40 overflow-hidden anim-scale-in">
            <div className="p-8 border-b border-gray-50 dark:border-emerald-900/30 flex items-center justify-between">
              <div>
                <h3 className="font-black text-xl text-[#1B4332] dark:text-emerald-400 uppercase tracking-tight">
                  {editando ? 'Editar Conocimiento' : 'Nuevo Entrenamiento'}
                </h3>
                <p className="text-xs text-gray-400 font-bold mt-1">Define cómo debe responder el asistente.</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Posible pregunta del alumno</label>
                <input 
                  required
                  value={form.pregunta}
                  onChange={e => setForm(p => ({ ...p, pregunta: e.target.value }))}
                  placeholder="Ej: ¿Hay algún lugar para comer cerca?"
                  className="w-full p-4 bg-gray-50 dark:bg-[#0F2018] border border-gray-100 dark:border-emerald-900/50 rounded-2xl outline-none focus:border-[#1B4332] text-sm font-bold dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Respuesta de la IA</label>
                <textarea 
                  required
                  value={form.respuesta}
                  onChange={e => setForm(p => ({ ...p, respuesta: e.target.value }))}
                  placeholder="Ej: ¡Claro! Puedes visitar la cafetería central o los puestos de snacks frente al Auditorio 2. 🥪"
                  className="w-full p-4 bg-gray-50 dark:bg-[#0F2018] border border-gray-100 dark:border-emerald-900/50 rounded-2xl outline-none focus:border-[#1B4332] text-sm font-medium dark:text-gray-200 h-32 resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Categoría</label>
                <select 
                  value={form.categoria}
                  onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}
                  className="w-full p-4 bg-gray-50 dark:bg-[#0F2018] border border-gray-100 dark:border-emerald-900/50 rounded-2xl outline-none focus:border-[#1B4332] text-xs font-black uppercase tracking-widest dark:text-gray-100"
                >
                  <option value="general">General / Logística</option>
                  <option value="servicios">Servicios (Wifi, Comida)</option>
                  <option value="reglas">Reglas y Asistencia</option>
                  <option value="emergencia">Emergencias</option>
                </select>
              </div>
            </div>

            <div className="p-8 bg-gray-50 dark:bg-emerald-900/20 flex gap-3">
              <button 
                type="button" onClick={() => setShowModal(false)}
                className="flex-1 py-4 bg-white dark:bg-[#0F2018] border border-gray-200 dark:border-emerald-900/40 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit" disabled={guardando}
                className="flex-2 py-4 bg-[#1B4332] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {guardando ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Guardar Memoria</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-50 bg-[#1B4332] text-white px-8 py-4 rounded-2xl shadow-2xl font-black text-sm flex items-center gap-3 animate-slide-up">
          <Check className="w-5 h-5" strokeWidth={4} />
          {toast}
        </div>
      )}
    </div>
  )
}

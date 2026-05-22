import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Megaphone, ArrowLeft, Send, Users, CheckCircle2, Loader2,
  Filter, MessageSquare, Clock, AlertCircle, X, ChevronDown,
  Zap, BookOpen, MapPin, Star
} from 'lucide-react'
import { supabase } from '../../services/supabase'
import { telegramService } from '../../services/telegram.service'

// ─── Constantes ───────────────────────────────────────────────────────────────
const PROGRAMA_LABELS = {
  todos:               'Todos los programas',
  sistemas:            'Ing. Sistemas',
  innovacion_agricola: 'Ing. Innovación Agrícola',
  contaduria:          'Contaduría',
  docente:             'Docentes',
  externo:             'Externos',
}

const PROGRAMA_COLORS = {
  sistemas:            'bg-blue-100 text-blue-700 border-blue-200',
  innovacion_agricola: 'bg-green-100 text-green-700 border-green-200',
  contaduria:          'bg-purple-100 text-purple-700 border-purple-200',
  docente:             'bg-amber-100 text-amber-700 border-amber-200',
  externo:             'bg-gray-100 text-gray-600 border-gray-200',
  todos:               'bg-emerald-100 text-emerald-700 border-emerald-200',
}

const TEMPLATES = [
  {
    label: 'Recordatorio',
    icon: Clock,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    text: '🔔 *Recordatorio UESSJR*\n\nTe recordamos que la Jornada Académica y Cultural 2026 está en curso. ¡No olvides revisar tu agenda y asistir a tus sesiones registradas!\n\nConsulta tu agenda en la app. 📅',
  },
  {
    label: 'Cambio de sede',
    icon: MapPin,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    text: '⚠️ *Aviso importante: Cambio de sede*\n\nSe informa que la sesión programada para hoy ha cambiado de escenario. Por favor consulta la app para ver la ubicación actualizada.\n\nGracias por tu comprensión. 🙏',
  },
  {
    label: 'Clausura',
    icon: Star,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    text: '🎓 *¡Clausura de la Jornada!*\n\nLa Jornada Académica y Cultural UESSJR 2026 llega a su fin. Gracias por tu participación y entusiasmo.\n\n¡Hasta la próxima edición! 🌟',
  },
  {
    label: 'Aviso general',
    icon: BookOpen,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    text: '📢 *Aviso de la Organización UESSJR*\n\n',
  },
]

// ─── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ count, programa, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-2xl p-8 max-w-md w-full text-center anim-scale-in">
        <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-4">
          <Megaphone className="w-8 h-8 text-[#D97706]" />
        </div>
        <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-1">Confirmar envío masivo</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
          Se enviará el mensaje a{' '}
          <strong className="text-gray-900 dark:text-gray-100">{count} estudiantes</strong>
          {programa !== 'todos' && (
            <> del programa <strong className="text-gray-900 dark:text-gray-100">{PROGRAMA_LABELS[programa]}</strong></>
          )}.
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-6">
          Esta acción enviará mensajes vía Telegram. No se puede deshacer.
        </p>
        <div className="space-y-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="w-full py-3 bg-[#D97706] text-white font-black rounded-xl hover:bg-amber-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
          >
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Enviando...</>
              : <><Send size={16} />Sí, enviar a {count} personas</>
            }
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="w-full py-3 text-gray-600 dark:text-gray-400 font-bold rounded-xl border border-gray-200 dark:border-emerald-900/40 hover:bg-gray-50 dark:hover:bg-emerald-900/20 transition-all text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Historial Item ────────────────────────────────────────────────────────────
function HistorialItem({ item }) {
  const date = new Date(item.fecha)
  const relTime = (() => {
    const diff = Date.now() - date.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `Hace ${mins} min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `Hace ${hrs}h`
    return `Hace ${Math.floor(hrs / 24)}d`
  })()

  return (
    <div className="p-4 bg-gray-50 dark:bg-[#0F2018] rounded-2xl border border-gray-100 dark:border-emerald-900/30">
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="text-xs font-bold text-gray-700 dark:text-gray-300 leading-snug line-clamp-2 flex-1">
          {item.mensaje}
        </p>
        <span className="text-[9px] font-black text-gray-400 whitespace-nowrap">{relTime}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
          {PROGRAMA_LABELS[item.programa] || 'Todos'}
        </span>
        <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={10} /> {item.enviados} enviados
        </span>
        {item.fallidos > 0 && (
          <span className="flex items-center gap-1 text-[9px] font-black text-red-500">
            <AlertCircle size={10} /> {item.fallidos} fallidos
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function BroadcastTelegram() {
  const navigate = useNavigate()
  const [mensaje, setMensaje] = useState('')
  const [programa, setPrograma] = useState('todos')
  const [allEstudiantes, setAllEstudiantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [historial, setHistorial] = useState([])
  const [showTemplates, setShowTemplates] = useState(false)

  // Cargar historial desde localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('uessjr-broadcast-history')
      if (stored) setHistorial(JSON.parse(stored))
    } catch {}
  }, [])

  // Cargar estudiantes
  useEffect(() => {
    async function loadEstudiantes() {
      try {
        const { data, error } = await supabase
          .from('estudiantes')
          .select('id, nombre, apellidos, telegram_chat_id, programa_academico')
          .not('telegram_chat_id', 'is', null)
        if (error) throw error
        setAllEstudiantes(data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadEstudiantes()
  }, [])

  // Filtrar destinatarios según programa seleccionado
  const destinatarios = programa === 'todos'
    ? allEstudiantes
    : allEstudiantes.filter(e => e.programa_academico === programa)

  const saveHistorial = (newEntry) => {
    const updated = [newEntry, ...historial].slice(0, 10)
    setHistorial(updated)
    try { localStorage.setItem('uessjr-broadcast-history', JSON.stringify(updated)) } catch {}
  }

  const handleSend = async () => {
    if (!mensaje.trim() || destinatarios.length === 0) return
    setSending(true)
    setProgress(0)
    setResult(null)
    setShowConfirm(false)

    let enviados = 0
    let fallidos = 0
    const batchSize = 25

    for (let i = 0; i < destinatarios.length; i += batchSize) {
      const batch = destinatarios.slice(i, i + batchSize)
      const promises = batch.map(est =>
        telegramService.sendMessage(est.telegram_chat_id, mensaje)
          .then(() => enviados++)
          .catch(() => fallidos++)
      )
      await Promise.allSettled(promises)
      setProgress(enviados + fallidos)
      if (i + batchSize < destinatarios.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    const newEntry = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      mensaje: mensaje.slice(0, 120),
      programa,
      enviados,
      fallidos,
    }
    saveHistorial(newEntry)
    setResult({ enviados, fallidos })
    setSending(false)
    setMensaje('')
  }

  const pct = destinatarios.length > 0 ? Math.round((progress / destinatarios.length) * 100) : 0

  return (
    <div className="min-h-screen bg-[#F2F5F3] dark:bg-[#0A1A11] pb-20">
      {/* Topbar */}
      <div className="bg-white dark:bg-[#122A1C] border-b border-gray-100 dark:border-emerald-900/40 px-4 py-5 sticky top-0 lg:top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-emerald-900/30 rounded-xl transition-all"
            >
              <ArrowLeft size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="font-black text-gray-900 dark:text-gray-100 text-xl leading-none">Broadcast</h1>
              <p className="text-[10px] font-black text-[#D97706] uppercase tracking-widest mt-1">Avisos masivos por Telegram</p>
            </div>
          </div>
          <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
            <Megaphone size={20} className="text-[#D97706]" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-5">

            {/* Filtro de destinatarios */}
            <div className="bg-white dark:bg-[#122A1C] rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-emerald-900/30">
              <div className="flex items-center gap-3 mb-5">
                <Filter className="text-[#1B4332] dark:text-emerald-400" size={18} />
                <h2 className="font-black text-gray-900 dark:text-white text-sm">Destinatarios</h2>
              </div>

              {loading ? (
                <div className="flex items-center gap-3 py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                  <span className="text-sm text-gray-400">Cargando estudiantes...</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                    {Object.entries(PROGRAMA_LABELS).map(([val, label]) => {
                      const count = val === 'todos'
                        ? allEstudiantes.length
                        : allEstudiantes.filter(e => e.programa_academico === val).length
                      return (
                        <button
                          key={val}
                          onClick={() => setPrograma(val)}
                          className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-between gap-2
                            ${programa === val
                              ? 'bg-[#1B4332] text-white border-[#1B4332] shadow-lg shadow-emerald-900/20'
                              : 'bg-white dark:bg-[#0F2018] text-gray-500 dark:text-gray-400 border-gray-100 dark:border-emerald-900/40 hover:border-emerald-200'
                            }`}
                        >
                          <span className="truncate">{label}</span>
                          <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded-lg font-black
                            ${programa === val ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-emerald-900/30 text-gray-500 dark:text-gray-400'}`}>
                            {count}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border
                    ${destinatarios.length > 0
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/40'
                      : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'
                    }`}>
                    <Users size={16} className={destinatarios.length > 0 ? 'text-emerald-600' : 'text-red-400'} />
                    <p className="text-xs font-black text-gray-700 dark:text-gray-300">
                      <span className={`text-lg mr-1 ${destinatarios.length > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-500'}`}>
                        {destinatarios.length}
                      </span>
                      estudiantes con Telegram vinculado{destinatarios.length !== 1 ? 's' : ''}
                      {programa !== 'todos' && ` en ${PROGRAMA_LABELS[programa]}`}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Redactar mensaje */}
            <div className="bg-white dark:bg-[#122A1C] rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-emerald-900/30">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <MessageSquare className="text-[#1B4332] dark:text-emerald-400" size={18} />
                  <h2 className="font-black text-gray-900 dark:text-white text-sm">Mensaje</h2>
                </div>
                <button
                  onClick={() => setShowTemplates(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-widest border border-purple-100 dark:border-purple-900/30 hover:bg-purple-100 transition-all"
                >
                  <Zap size={12} /> Templates <ChevronDown size={12} className={`transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Templates desplegables */}
              {showTemplates && (
                <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-gray-50 dark:bg-[#0F2018] rounded-2xl border border-gray-100 dark:border-emerald-900/30">
                  {TEMPLATES.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => { setMensaje(t.text); setShowTemplates(false) }}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left hover:scale-[0.98] transition-all ${t.color}`}
                    >
                      <t.icon size={14} className="shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                    </button>
                  ))}
                </div>
              )}

              <textarea
                value={mensaje}
                onChange={e => setMensaje(e.target.value)}
                disabled={sending}
                rows={7}
                placeholder="Escribe el mensaje que recibirán los estudiantes seleccionados..."
                className="w-full px-4 py-4 bg-gray-50 dark:bg-[#0F2018] border border-gray-100 dark:border-emerald-900/50 rounded-2xl outline-none focus:border-[#1B4332] text-sm font-medium dark:text-gray-200 resize-none transition-all"
              />

              <div className="flex items-center justify-between mt-2 mb-4">
                <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600">
                  {mensaje.length} caracteres
                </span>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                  Markdown compatible con Telegram
                </span>
              </div>

              {/* Progreso o botón */}
              {sending ? (
                <div className="space-y-3">
                  <div className="h-3 bg-gray-100 dark:bg-emerald-900/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#1B4332] to-emerald-500 transition-all duration-300 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-center text-xs font-black text-gray-500 dark:text-gray-400">
                    Enviando mensajes: {progress} / {destinatarios.length} ({pct}%)
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={!mensaje.trim() || destinatarios.length === 0}
                  className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 bg-[#D97706] text-white shadow-lg shadow-amber-900/20 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={18} /> Enviar a {destinatarios.length} personas
                </button>
              )}
            </div>

            {/* Resultado del envío */}
            {result && (
              <div className="p-6 rounded-[2rem] border-2 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 flex items-start gap-4">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={24} />
                <div>
                  <h3 className="text-sm font-black text-emerald-900 dark:text-emerald-400 mb-1">Envío completado</h3>
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-500">
                    {result.enviados} mensajes enviados exitosamente.
                    {result.fallidos > 0 && (
                      <span className="text-red-500 ml-2">{result.fallidos} fallaron (el estudiante puede haber bloqueado el bot).</span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Columna derecha: previsualización + historial */}
          <div className="space-y-5">
            {/* Previsualización */}
            <div className="bg-white dark:bg-[#122A1C] rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-emerald-900/30">
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Vista previa en Telegram</p>
              <div className="bg-[#efebe9] dark:bg-[#1a1a2e] rounded-2xl p-4 min-h-[120px]">
                <div className="bg-white dark:bg-[#2a2a3e] rounded-2xl p-3 shadow-sm max-w-[85%] ml-auto">
                  <p className="text-[11px] text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-words font-medium">
                    {mensaje || <span className="text-gray-300 dark:text-gray-600 italic">El mensaje aparecerá aquí...</span>}
                  </p>
                  <p className="text-[9px] text-gray-400 text-right mt-2">UESSJR Agenda</p>
                </div>
              </div>
            </div>

            {/* Historial */}
            <div className="bg-white dark:bg-[#122A1C] rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-emerald-900/30">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Historial de envíos</p>
                {historial.length > 0 && (
                  <button
                    onClick={() => {
                      setHistorial([])
                      localStorage.removeItem('uessjr-broadcast-history')
                    }}
                    className="text-[9px] font-black text-gray-300 hover:text-red-400 uppercase tracking-widest transition-colors"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {historial.length === 0 ? (
                <div className="py-10 flex flex-col items-center opacity-30">
                  <Clock size={28} className="text-gray-400 mb-2" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Sin envíos recientes</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide">
                  {historial.map(item => (
                    <HistorialItem key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showConfirm && (
        <ConfirmModal
          count={destinatarios.length}
          programa={programa}
          onConfirm={handleSend}
          onCancel={() => setShowConfirm(false)}
          loading={sending}
        />
      )}
    </div>
  )
}
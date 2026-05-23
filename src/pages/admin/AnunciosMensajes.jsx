import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Megaphone, ArrowLeft, Send, Users, CheckCircle2, Loader2,
  Filter, MessageSquare, Clock, AlertCircle, X, ChevronDown,
  Zap, BookOpen, MapPin, Star, Bell, Mail, Globe, Check
} from 'lucide-react'
import { supabase } from '../../services/supabase'
import { telegramService } from '../../services/telegram.service'
import { notificacionesService } from '../../services/notificaciones.service'
import { gasService } from '../../services/gas.service'

// ─── Constantes ───────────────────────────────────────────────────────────────
const PROGRAMA_LABELS = {
  todos:               'Todos los programas',
  sistemas:            'Ing. Sistemas',
  innovacion_agricola: 'Ing. Innovación Agrícola',
  contaduria:          'Contaduría',
  docente:             'Docentes',
  externo:             'Externos',
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
function ConfirmModal({ count, programa, channels, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-2xl p-8 max-w-md w-full text-center anim-scale-in border border-emerald-900/20">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
          <Send className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-1 uppercase tracking-tight">Confirmar Envío</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 leading-relaxed">
          Se enviará el mensaje a{' '}
          <strong className="text-gray-900 dark:text-gray-100">{count} alumnos</strong>
          {programa !== 'todos' && (
            <> del programa <strong className="text-[#1B4332] dark:text-emerald-400">{PROGRAMA_LABELS[programa]}</strong></>
          )}.
        </p>

        <div className="bg-gray-50 dark:bg-emerald-950/20 p-4 rounded-xl mb-6 text-left border border-gray-100 dark:border-emerald-900/30">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Canales seleccionados:</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
              <Globe size={14} className="text-emerald-500" /> Plataforma Web (Campanita)
            </div>
            {channels.telegram && (
              <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                <Send size={14} className="text-blue-500" /> Telegram (Bot)
              </div>
            )}
            {channels.email && (
              <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                <Mail size={14} className="text-amber-500" /> Correo Electrónico (Plus)
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="w-full py-4 bg-[#1B4332] text-white font-black rounded-2xl hover:bg-emerald-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-900/20"
          >
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Procesando...</>
              : <><Send size={16} /> Iniciar Difusión</>
            }
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="w-full py-4 text-gray-500 dark:text-gray-400 font-black rounded-2xl border border-gray-200 dark:border-emerald-900/40 hover:bg-gray-100 dark:hover:bg-emerald-900/20 transition-all text-xs uppercase tracking-widest"
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
    <div className="p-5 bg-white dark:bg-[#122A1C] rounded-[1.5rem] border border-gray-100 dark:border-emerald-900/30 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3 flex-1">
          {item.mensaje}
        </p>
        <span className="text-[9px] font-black text-gray-400 whitespace-nowrap uppercase tracking-tighter">{relTime}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[8px] font-black bg-gray-100 dark:bg-emerald-900/30 text-gray-500 dark:text-gray-400 px-2 py-1 rounded-md uppercase tracking-widest">
          {PROGRAMA_LABELS[item.programa] || 'Todos'}
        </span>
        <div className="flex items-center gap-2 ml-auto">
          {item.channels?.telegram && <Send size={10} className="text-blue-500" />}
          {item.channels?.email && <Mail size={10} className="text-amber-500" />}
          <Globe size={10} className="text-emerald-500" />
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AnunciosMensajes() {
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
  
  const [channels, setChannels] = useState({
    web: true, // Siempre activo
    telegram: true,
    email: false
  })

  // Cargar historial
  useEffect(() => {
    try {
      const stored = localStorage.getItem('uessjr-anuncios-history')
      if (stored) setHistorial(JSON.parse(stored))
    } catch {}
  }, [])

  // Cargar estudiantes
  useEffect(() => {
    async function loadEstudiantes() {
      try {
        const { data, error } = await supabase
          .from('estudiantes')
          .select('id, nombre, apellidos, correo, telegram_chat_id, programa_academico')
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

  // Filtrar destinatarios según programa
  const destinatarios = programa === 'todos'
    ? allEstudiantes
    : allEstudiantes.filter(e => e.programa_academico === programa)

  const saveHistorial = (newEntry) => {
    const updated = [newEntry, ...historial].slice(0, 10)
    setHistorial(updated)
    try { localStorage.setItem('uessjr-anuncios-history', JSON.stringify(updated)) } catch {}
  }

  const handleSend = async () => {
    if (!mensaje.trim() || destinatarios.length === 0) return
    setSending(true)
    setProgress(0)
    setResult(null)
    setShowConfirm(false)

    let totalEnviados = 0
    let fallidosTelegram = 0
    
    // 1. Notificación WEB (Siempre)
    try {
      await notificacionesService.create({
        titulo: 'Anuncio de la Organización',
        mensaje: mensaje,
        tipo: 'info',
        estudiante_id: programa === 'todos' ? null : 'FILTRADO' // Usamos un flag o insertamos por cada uno si no es global
      })
      // Nota: notificacionesService.create maneja el null como global. 
      // Si hay filtro por carrera, deberíamos insertar una por cada alumno en la tabla notificaciones 
      // o mejorar el servicio para soportar filtros. Por ahora, si es todos es global.
      if (programa !== 'todos') {
        const insertNotifs = destinatarios.map(est => ({
          titulo: 'Aviso para tu carrera',
          mensaje: mensaje,
          tipo: 'info',
          estudiante_id: est.id,
          leida: false
        }))
        await supabase.from('notificaciones').insert(insertNotifs)
      }
    } catch (e) { console.error('Error Web Notif:', e) }

    // 2. Telegram & Email (Batch processing)
    const batchSize = 15
    for (let i = 0; i < destinatarios.length; i += batchSize) {
      const batch = destinatarios.slice(i, i + batchSize)
      const promises = []

      batch.forEach(est => {
        // Telegram
        if (channels.telegram && est.telegram_chat_id) {
          promises.push(
            telegramService.sendMessage(est.telegram_chat_id, mensaje)
              .catch(() => fallidosTelegram++)
          )
        }
        // Email
        if (channels.email && est.correo) {
          promises.push(
            gasService.sendEmail({
              to: est.correo,
              subject: 'Aviso Importante: Jornada UESSJR',
              type: 'WELCOME', // Usamos WELCOME que es más común que esté configurado
              data: {
                nombre: est.nombre,
                mensaje: mensaje,
                action_url: window.location.origin,
                action_text: 'Ver en la plataforma'
              }
            }).catch(e => console.error('Email Error:', e))
          )
        }
      })

      if (promises.length > 0) await Promise.allSettled(promises)
      
      totalEnviados += batch.length
      setProgress(totalEnviados)
      
      // Delay sutil para no saturar APIs
      if (i + batchSize < destinatarios.length) {
        await new Promise(r => setTimeout(r, 800))
      }
    }

    const newEntry = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      mensaje: mensaje.slice(0, 150),
      programa,
      channels: { ...channels },
      enviados: totalEnviados,
    }
    saveHistorial(newEntry)
    setResult({ success: true, count: totalEnviados })
    setSending(false)
    setMensaje('')
  }

  const pct = destinatarios.length > 0 ? Math.round((progress / destinatarios.length) * 100) : 0

  return (
    <div className="min-h-screen bg-[#F2F5F3] dark:bg-[#0A1A11] pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-[#122A1C] border-b border-gray-100 dark:border-emerald-900/40 px-4 py-6 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="p-3 hover:bg-gray-50 dark:hover:bg-emerald-900/20 rounded-2xl transition-all">
              <ArrowLeft size={20} className="text-gray-400" />
            </button>
            <div>
              <h1 className="font-black text-gray-900 dark:text-gray-100 text-xl leading-none">Anuncios y Mensajes</h1>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mt-2 flex items-center gap-1">
                <Globe size={10} /> Sistema de Difusión Omnicanal
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
             <div className="flex -space-x-2">
               <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-white dark:border-[#122A1C] flex items-center justify-center text-emerald-600"><Globe size={14}/></div>
               <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white dark:border-[#122A1C] flex items-center justify-center text-blue-600"><Send size={14}/></div>
               <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-white dark:border-[#122A1C] flex items-center justify-center text-amber-600"><Mail size={14}/></div>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Panel Izquierdo: Configuración y Mensaje */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Destinatarios */}
            <div className="bg-white dark:bg-[#122A1C] rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-emerald-900/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600"><Users size={18} /></div>
                <h2 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-widest">Destinatarios</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {Object.entries(PROGRAMA_LABELS).map(([val, label]) => {
                  const active = programa === val
                  return (
                    <button
                      key={val}
                      onClick={() => setPrograma(val)}
                      className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border text-left flex flex-col justify-between h-24
                        ${active 
                          ? 'bg-[#1B4332] text-white border-[#1B4332] shadow-xl shadow-emerald-900/20 translate-y-[-2px]' 
                          : 'bg-gray-50 dark:bg-[#0F2018] text-gray-400 dark:text-gray-500 border-gray-100 dark:border-emerald-900/40 hover:border-emerald-200'
                        }`}
                    >
                      <span>{label}</span>
                      <span className={`text-xs ${active ? 'text-emerald-400' : 'text-gray-400'}`}>
                        {val === 'todos' ? allEstudiantes.length : allEstudiantes.filter(e => e.programa_academico === val).length} Alumnos
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Canales */}
              <div className="pt-6 border-t border-gray-50 dark:border-emerald-900/20">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Canales de envío:</p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase border border-emerald-100 dark:border-emerald-800/40">
                    <Check size={12} /> Plataforma Web
                  </div>
                  <button 
                    onClick={() => setChannels(c => ({...c, telegram: !c.telegram}))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase border transition-all
                    ${channels.telegram ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-400 border-gray-100 opacity-50'}`}
                  >
                    {channels.telegram ? <Check size={12} /> : <X size={12} />} Telegram
                  </button>
                  <button 
                    onClick={() => setChannels(c => ({...c, email: !c.email}))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase border transition-all
                    ${channels.email ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-gray-50 text-gray-400 border-gray-100 opacity-50'}`}
                  >
                    {channels.email ? <Check size={12} /> : <X size={12} />} Correo (Plus)
                  </button>
                </div>
              </div>
            </div>

            {/* Redacción */}
            <div className="bg-white dark:bg-[#122A1C] rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-emerald-900/30">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600"><MessageSquare size={18} /></div>
                  <h2 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-widest">Mensaje</h2>
                </div>
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="px-4 py-2 bg-gray-50 dark:bg-emerald-950/40 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-100 dark:border-emerald-900/20 hover:bg-gray-100 transition-all flex items-center gap-2"
                >
                  <Zap size={12} /> Plantillas
                </button>
              </div>

              {showTemplates && (
                <div className="grid grid-cols-2 gap-3 mb-6 p-4 bg-gray-50 dark:bg-[#0F2018] rounded-[1.5rem] border border-gray-100 dark:border-emerald-900/30 animate-in fade-in slide-in-from-top-2">
                  {TEMPLATES.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => { setMensaje(t.text); setShowTemplates(false) }}
                      className={`flex items-center gap-3 p-4 rounded-2xl border text-left hover:shadow-md transition-all ${t.color}`}
                    >
                      <t.icon size={16} className="shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-widest leading-tight">{t.label}</span>
                    </button>
                  ))}
                </div>
              )}

              <textarea
                value={mensaje}
                onChange={e => setMensaje(e.target.value)}
                rows={8}
                placeholder="Escribe el mensaje que llegará a todos los canales seleccionados..."
                className="w-full p-6 bg-gray-50 dark:bg-[#0F2018] border border-gray-100 dark:border-emerald-900/50 rounded-[2rem] outline-none focus:border-[#1B4332] text-base font-medium dark:text-gray-200 resize-none transition-all placeholder:text-gray-400"
              />

              <div className="flex items-center justify-between mt-4 mb-8 px-2">
                <span className="text-[10px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-widest">
                  {mensaje.length} caracteres
                </span>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                  <Zap size={10} /> Inmediatez garantizada
                </span>
              </div>

              {sending ? (
                <div className="space-y-4">
                  <div className="h-4 bg-gray-100 dark:bg-emerald-900/20 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-[#1B4332] to-emerald-500 transition-all duration-300" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Procesando difusión: {progress} / {destinatarios.length} ({pct}%)
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={!mensaje.trim() || destinatarios.length === 0}
                  className="w-full py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 bg-[#1B4332] text-white shadow-xl shadow-emerald-900/30 hover:bg-emerald-800 disabled:opacity-40 active:scale-[0.98]"
                >
                  <Send size={20} /> Iniciar Envío Masivo
                </button>
              )}
            </div>

            {result && (
              <div className="p-8 rounded-[2.5rem] border-2 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 flex items-center gap-6 animate-in zoom-in-95 duration-300">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-emerald-900 dark:text-emerald-400 leading-none">Difusión Exitosa</h3>
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-500 mt-2">
                    El mensaje ha sido procesado para {result.count} alumnos a través de los canales activos.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Panel Derecho: Historial */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-white dark:bg-[#122A1C] rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-emerald-900/30">
               <div className="flex items-center justify-between mb-8">
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Historial Reciente</p>
                  {historial.length > 0 && (
                    <button onClick={() => { setHistorial([]); localStorage.removeItem('uessjr-anuncios-history') }} className="text-[9px] font-black text-red-400 uppercase tracking-widest opacity-50 hover:opacity-100">
                      Limpiar
                    </button>
                  )}
               </div>

               {historial.length === 0 ? (
                 <div className="py-20 flex flex-col items-center opacity-20">
                   <Clock size={40} className="text-gray-400 mb-4" />
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sin registros</p>
                 </div>
               ) : (
                 <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-hide pr-2">
                   {historial.map(item => <HistorialItem key={item.id} item={item} />)}
                 </div>
               )}
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-br from-[#1B4332] to-[#0D2B1D] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Globe size={120} /></div>
              <div className="relative z-10">
                <h4 className="font-black text-sm uppercase tracking-widest mb-4">Ayuda Técnica</h4>
                <ul className="space-y-3">
                  <li className="text-[10px] flex items-start gap-2 text-emerald-100/70"><span className="w-1 h-1 bg-emerald-400 rounded-full mt-1.5 shrink-0" /> Los mensajes en la Web aparecen al instante en la campanita.</li>
                  <li className="text-[10px] flex items-start gap-2 text-emerald-100/70"><span className="w-1 h-1 bg-emerald-400 rounded-full mt-1.5 shrink-0" /> Telegram requiere que el alumno haya vinculado su cuenta previamente.</li>
                  <li className="text-[10px] flex items-start gap-2 text-emerald-100/70"><span className="w-1 h-1 bg-emerald-400 rounded-full mt-1.5 shrink-0" /> El envío por correo es asíncrono y puede tardar unos minutos en llegar.</li>
                </ul>
              </div>
            </div>

          </div>

        </div>
      </div>

      {showConfirm && (
        <ConfirmModal
          count={destinatarios.length}
          programa={programa}
          channels={channels}
          onConfirm={handleSend}
          onCancel={() => setShowConfirm(false)}
          loading={sending}
        />
      )}
    </div>
  )
}

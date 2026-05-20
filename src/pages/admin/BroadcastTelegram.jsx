import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Megaphone, ArrowLeft, Send, Users, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { supabase } from '../../services/supabase'
import { telegramService } from '../../services/telegram.service'

export default function BroadcastTelegram() {
  const navigate = useNavigate()
  const [mensaje, setMensaje] = useState('')
  const [estudiantes, setEstudiantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)

  useEffect(() => {
    async function loadEstudiantes() {
      try {
        const { data, error } = await supabase
          .from('estudiantes')
          .select('id, nombre, telegram_chat_id')
          .not('telegram_chat_id', 'is', null)
        
        if (error) throw error
        setEstudiantes(data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadEstudiantes()
  }, [])

  const handleSend = async () => {
    if (!mensaje.trim() || estudiantes.length === 0) return
    if (!window.confirm(`¿Estás seguro de enviar este mensaje a ${estudiantes.length} estudiantes?`)) return
    
    setSending(true)
    setProgress(0)
    setResult(null)

    let enviados = 0
    let fallidos = 0
    const batchSize = 25
    
    for (let i = 0; i < estudiantes.length; i += batchSize) {
      const batch = estudiantes.slice(i, i + batchSize)
      
      const promises = batch.map(est => 
        telegramService.sendMessage(est.telegram_chat_id, mensaje)
          .then(() => enviados++)
          .catch(e => fallidos++)
      )
      
      await Promise.allSettled(promises)
      setProgress(enviados + fallidos)
      
      if (i + batchSize < estudiantes.length) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // delay 1s entre batches
      }
    }

    setResult({ enviados, fallidos })
    setSending(false)
    setMensaje('')
  }

  return (
    <div className="min-h-screen bg-[#F2F5F3] dark:bg-[#0A1A11] pb-20">
      <div className="bg-white dark:bg-[#122A1C] border-b border-gray-100 dark:border-emerald-900/40 px-4 py-5 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-gray-100 dark:hover:bg-emerald-900/30 rounded-xl transition-all">
              <ArrowLeft size={20} className="text-gray-500" />
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

      <div className="max-w-2xl mx-auto px-4 mt-8 space-y-6">
        {loading ? (
          <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
        ) : (
          <>
            <div className="bg-white dark:bg-[#122A1C] rounded-[2.5rem] p-6 shadow-sm border border-gray-100 dark:border-emerald-900/30">
              <div className="flex items-center gap-3 mb-6">
                <Users className="text-[#1B4332] dark:text-emerald-400" size={20} />
                <h2 className="font-black text-gray-900 dark:text-white">Destinatarios</h2>
                <span className="ml-auto px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-xs font-black rounded-full">
                  {estudiantes.length} vinculados
                </span>
              </div>
              
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Mensaje</label>
                <textarea
                  value={mensaje}
                  onChange={e => setMensaje(e.target.value)}
                  disabled={sending}
                  rows={6}
                  placeholder="Escribe el mensaje que recibirán todos los estudiantes..."
                  className="w-full px-4 py-4 bg-gray-50 dark:bg-[#0F2018] border border-gray-100 dark:border-emerald-900/50 rounded-2xl outline-none focus:border-[#1B4332] text-sm font-medium dark:text-gray-200 resize-none"
                />
                
                {sending ? (
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 dark:bg-emerald-900/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#1B4332] transition-all duration-300"
                        style={{ width: `${(progress / estudiantes.length) * 100}%` }}
                      />
                    </div>
                    <p className="text-center text-xs font-bold text-gray-500">Enviando: {progress} / {estudiantes.length}</p>
                  </div>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={!mensaje.trim() || estudiantes.length === 0}
                    className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 bg-[#1B4332] text-white shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                  >
                    <Send size={18} /> Enviar a todos
                  </button>
                )}
              </div>
            </div>

            {result && (
              <div className="p-6 rounded-[2rem] border-2 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 flex items-start gap-4 anim-scale-in">
                <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
                <div>
                  <h3 className="text-sm font-black text-emerald-900 dark:text-emerald-400 mb-1">Envío completado</h3>
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-500">
                    {result.enviados} mensajes enviados exitosamente. {result.fallidos > 0 && `${result.fallidos} fallaron.`}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
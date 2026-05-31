import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { 
  Camera, CheckCircle2, XCircle, Users, 
  ArrowLeft, Loader2, UserCheck, MapPin, 
  Clock, AlertTriangle, ShieldCheck, X
} from 'lucide-react'
import { supabase } from '../../services/supabase'
import { sesionesService } from '../../services/sesiones.service'
import { telegramService } from '../../services/telegram.service'

const PROGRAMA_ABBR = {
  sistemas:            'ISC',
  innovacion_agricola: 'IIAS',
  contaduria:          'LC',
}

export default function CheckInScanner() {
  const navigate = useNavigate()
  const [sesiones, setSesiones] = useState([])
  const [sesionId, setSesionId] = useState('')
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [offlineCount, setOfflineCount] = useState(0)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncing, setSyncing] = useState(false)
  const [cachedStudents, setCachedStudents] = useState({})
  
  const scannerRef = useRef(null)
  const cameraAreaRef = useRef(null)
  const resultRef = useRef(null)
  const recentScansRef = useRef(new Map())
  
  const sesionIdRef = useRef(sesionId)
  const cachedStudentsRef = useRef(cachedStudents)
  const processingRef = useRef(processing)
  const sesionesRef = useRef(sesiones)
  const isOnlineRef = useRef(isOnline)

  useEffect(() => { sesionIdRef.current = sesionId }, [sesionId])
  useEffect(() => { cachedStudentsRef.current = cachedStudents }, [cachedStudents])
  useEffect(() => { processingRef.current = processing }, [processing])
  useEffect(() => { sesionesRef.current = sesiones }, [sesiones])
  useEffect(() => { isOnlineRef.current = isOnline }, [isOnline])

  useEffect(() => {
    async function loadSessions() {
      try {
        const { data: jornada } = await supabase.from('jornadas').select('id').eq('estado', 'activa').single()
        if (!jornada) return
        const data = await sesionesService.getByJornada(jornada.id)
        const hoy = new Date().toLocaleDateString('en-CA')
        const sesionesHoy = (data || []).filter(s => s.dias_jornada?.fecha === hoy)
        setSesiones(sesionesHoy)
      } catch (err) { console.error(err) } finally { setLoading(false) }
    }
    loadSessions()
  }, [])

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); syncOfflineCheckins() }
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    const stored = localStorage.getItem('offline_checkins')
    if (stored) setOfflineCount(JSON.parse(stored).length)
    const storedStudents = localStorage.getItem('cached_students')
    if (storedStudents) setCachedStudents(JSON.parse(storedStudents))
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    async function fetchAndCacheStudents() {
      try {
        const { data } = await supabase.from('estudiantes').select('id, nombre, apellidos, matricula, programa_academico, telegram_chat_id, qr_token')
        if (data) {
          const map = {}
          data.forEach(est => { if (est.qr_token) map[est.qr_token] = est })
          localStorage.setItem('cached_students', JSON.stringify(map))
          setCachedStudents(map)
        }
      } catch (err) { console.error(err) }
    }
    if (isOnline) fetchAndCacheStudents()
  }, [isOnline])

  const registerOffline = (qrToken, qrMatricula) => {
    let est = cachedStudentsRef.current[qrToken]
    if (!est) est = { id: null, qr_token: qrToken, nombre: 'Estudiante', apellidos: '(Offline)', matricula: qrMatricula, programa_academico: 'S/D' }
    const stored = localStorage.getItem('offline_checkins')
    const checkins = stored ? JSON.parse(stored) : []
    const ya = checkins.some(c => c.sesion_id === sesionIdRef.current && (c.estudiante_id === est.id || c.qr_token === qrToken))
    if (ya) return setLastResult({ success: false, msg: 'Ya registrado offline', student: est })
    checkins.push({ estudiante_id: est.id, qr_token: qrToken, sesion_id: sesionIdRef.current, hora_entrada: new Date().toLocaleTimeString('it-IT'), estudiante_datos: est })
    localStorage.setItem('offline_checkins', JSON.stringify(checkins))
    setOfflineCount(checkins.length)
    setLastResult({ success: true, msg: 'Guardado offline ⏳', student: est })
    setTimeout(() => setLastResult(null), 4000)
  }

  const syncOfflineCheckins = async () => {
    const stored = localStorage.getItem('offline_checkins')
    if (!stored) return
    const checkins = JSON.parse(stored)
    if (checkins.length === 0) return
    setSyncing(true)
    const remaining = []
    for (const item of checkins) {
      try {
        let sid = item.estudiante_id
        if (!sid && item.qr_token) {
          const { data } = await supabase.from('estudiantes').select('id').eq('qr_token', item.qr_token).maybeSingle()
          if (data) sid = data.id
        }
        if (!sid) throw new Error('ID no resuelto')
        const { data: exist } = await supabase.from('asistencias').select('id').eq('estudiante_id', sid).eq('sesion_id', item.sesion_id).maybeSingle()
        if (!exist) await supabase.from('asistencias').insert([{ estudiante_id: sid, sesion_id: item.sesion_id, hora_entrada: item.hora_entrada }])
      } catch (err) { remaining.push(item) }
    }
    localStorage.setItem('offline_checkins', JSON.stringify(remaining))
    setOfflineCount(remaining.length)
    setSyncing(false)
  }

  const handleScanSuccess = async (decodedText) => {
    if (processingRef.current || !sesionIdRef.current) return
    const now = Date.now()
    if (recentScansRef.current.has(decodedText) && (now - recentScansRef.current.get(decodedText) < 5000)) return
    recentScansRef.current.set(decodedText, now)
    const parts = decodedText.split(':')
    if (parts[0] !== 'student' || parts.length < 2) return setLastResult({ success: false, msg: 'QR no válido' })
    const qrToken = parts[1], qrMatricula = parts[2] || 'S/M'
    setProcessing(true)
    if (!isOnlineRef.current) { setProcessing(false); registerOffline(qrToken, qrMatricula); return }
    try {
      const { data: est, error: eErr } = await supabase.from('estudiantes').select('id, nombre, apellidos, matricula, programa_academico, telegram_chat_id').eq('qr_token', qrToken).single()
      if (eErr || !est) throw new Error('Estudiante no encontrado')
      const { data: insc } = await supabase.from('inscripciones').select('estado').eq('estudiante_id', est.id).eq('sesion_id', sesionIdRef.current).maybeSingle()
      if (!insc) return setLastResult({ success: false, msg: 'No está inscrito en esta sesión', student: est })
      if (insc.estado === 'lista_espera') return setLastResult({ success: false, msg: 'En LISTA DE ESPERA (No confirmado)', student: est })
      const { data: exist } = await supabase.from('asistencias').select('id').eq('estudiante_id', est.id).eq('sesion_id', sesionIdRef.current).maybeSingle()
      if (exist) return setLastResult({ success: false, msg: 'Asistencia ya registrada anteriormente', student: est })
      await supabase.from('asistencias').insert([{ estudiante_id: est.id, sesion_id: sesionIdRef.current, hora_entrada: new Date().toLocaleTimeString('it-IT') }])
      if (est.telegram_chat_id) {
        const sesionActual = sesionesRef.current.find(s => s.id === sesionIdRef.current)
        telegramService.sendMessage(est.telegram_chat_id, `✅ ¡Tu asistencia a "${sesionActual?.nombre}" ha sido registrada!`).catch(() => {})
      }
      setLastResult({ success: true, msg: '¡Asistencia confirmada exitosamente!', student: est })
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
      setTimeout(() => setLastResult(null), 6000)
    } catch (err) {
      if (err.message.includes('fetch')) registerOffline(qrToken, qrMatricula)
      else setLastResult({ success: false, msg: err.message })
    } finally { setProcessing(false) }
  }

  useEffect(() => {
    let isM = true, q = null
    async function start() {
      if (scanning && sesionId) {
        await new Promise(r => setTimeout(r, 100))
        if (!isM) return
        setTimeout(() => cameraAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
        q = new Html5Qrcode("reader")
        try {
          await q.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 }, (txt) => handleScanSuccess(txt), () => {})
          if (!isM) q.stop().then(() => q.clear())
          else scannerRef.current = q
        } catch (err) { setLastResult({ success: false, msg: "Error de cámara" }) }
      }
    }
    start()
    return () => {
      isM = false
      if (scannerRef.current) { scannerRef.current.stop().then(() => scannerRef.current.clear()).catch(() => {}); scannerRef.current = null }
    }
  }, [scanning, sesionId])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A1A11] pb-20">
      
      {lastResult && (
        <div className="fixed top-20 inset-x-4 z-[60] anim-fade-up">
          <div className={`p-4 rounded-3xl shadow-2xl border-2 flex items-center justify-between gap-4 backdrop-blur-md ${lastResult.success ? 'bg-emerald-500/90 border-emerald-400' : 'bg-red-600/90 border-red-500'} text-white`}>
            <div className="flex items-center gap-3">
              {lastResult.success ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase opacity-80 leading-none">{lastResult.success ? 'Éxito' : 'Atención'}</p>
                <p className="text-sm font-bold truncate">{lastResult.msg}</p>
              </div>
            </div>
            <button onClick={() => setLastResult(null)} className="p-2 hover:bg-black/10 rounded-full shrink-0"><X size={18} /></button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#122A1C] border-b border-gray-100 dark:border-emerald-900/40 px-4 py-4 sticky top-0 z-50">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-xl"><ArrowLeft size={20} /></button>
            <h1 className="font-black text-gray-900 dark:text-gray-100">Punto de Control</h1>
          </div>
          <Users size={20} className="text-[#1B4332]" />
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-8 space-y-6">
        <div className="bg-white dark:bg-[#122A1C] rounded-[2rem] p-5 border border-gray-100 dark:border-emerald-900/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
            <p className="text-xs font-bold">{isOnline ? 'En línea' : 'Desconectado'}</p>
          </div>
          {offlineCount > 0 && <button onClick={syncOfflineCheckins} className="px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl">Sincronizar ({offlineCount})</button>}
        </div>
        
        <div className="bg-white dark:bg-[#122A1C] rounded-[2rem] p-6 border border-gray-100 dark:border-emerald-900/30">
          <p className="text-xs font-bold mb-3">Sesión actual:</p>
          <select value={sesionId} onChange={(e) => { setSesionId(e.target.value); setScanning(false); setLastResult(null); }} className="w-full p-4 bg-gray-50 dark:bg-[#0F2018] rounded-2xl outline-none text-sm font-bold">
            <option value="">— Elegir sesión —</option>
            {sesiones.map(s => <option key={s.id} value={s.id}>{s.hora_inicio?.slice(0,5)} · {s.nombre}</option>)}
          </select>
          <button disabled={!sesionId} onClick={() => setScanning(!scanning)} className={`w-full py-4 mt-4 rounded-2xl font-black text-sm uppercase transition-all flex items-center justify-center gap-3 ${scanning ? 'bg-red-50 text-red-600' : 'bg-[#1B4332] text-white'}`}>
            {scanning ? <><XCircle size={18} /> Detener</> : <><Camera size={18} /> Iniciar</>}
          </button>
        </div>

        <div ref={cameraAreaRef} className="scroll-mt-24">
          {scanning && sesionId && (
            <div className="relative anim-fade-up">
              <div id="reader" className="overflow-hidden rounded-[2.5rem] border-4 border-white dark:border-[#122A1C] shadow-2xl bg-black" />
              <div className="absolute inset-x-0 -bottom-3 flex justify-center"><span className="bg-[#1B4332] text-white px-4 py-1 rounded-full text-[9px] font-black uppercase">Cámara Activa</span></div>
            </div>
          )}
        </div>

        <div ref={resultRef} className="scroll-mt-24">
          {lastResult && lastResult.student && (
            <div className="p-6 rounded-[2.5rem] border-2 shadow-xl bg-white dark:bg-[#122A1C] border-gray-100 dark:border-emerald-900/30">
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-50 dark:border-emerald-900/20">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${lastResult.success ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}><UserCheck size={24} /></div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Estudiante</p>
                  <h3 className="text-base font-black truncate">{lastResult.student.nombre} {lastResult.student.apellidos}</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-[9px] font-black text-gray-400 uppercase">Matrícula</p><p className="font-bold text-xs">{lastResult.student.matricula}</p></div>
                <div><p className="text-[9px] font-black text-gray-400 uppercase">Carrera</p><p className="font-bold text-xs uppercase truncate">{PROGRAMA_ABBR[lastResult.student.programa_academico] || lastResult.student.programa_academico}</p></div>
              </div>
            </div>
          )}
        </div>

        {scanning && !lastResult && sesionId && (
          <div className="bg-gray-100 dark:bg-[#122A1C] p-6 rounded-[2rem] text-center anim-fade-up">
            <h2 className="text-sm font-black text-[#1B4332]">{sesiones.find(s => s.id === sesionId)?.nombre}</h2>
            <p className="text-xs text-gray-500 font-bold mt-2">{sesiones.find(s => s.id === sesionId)?.hora_inicio?.slice(0,5)} hrs</p>
          </div>
        )}
      </div>

      {processing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100] flex items-center justify-center">
          <div className="bg-white dark:bg-[#122A1C] p-8 rounded-3xl flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-emerald-500" />
            <p className="text-xs font-black uppercase">Validando...</p>
          </div>
        </div>
      )}

    </div>
  )
}

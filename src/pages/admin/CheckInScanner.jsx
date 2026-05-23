import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { 
  Camera, CheckCircle2, XCircle, Users, 
  ArrowLeft, Loader2, UserCheck, MapPin, 
  Clock, AlertTriangle, ShieldCheck
} from 'lucide-react'
import { supabase } from '../../services/supabase'
import { sesionesService } from '../../services/sesiones.service'
import { telegramService } from '../../services/telegram.service'

export default function CheckInScanner() {
  const navigate = useNavigate()
  const [sesiones, setSesiones] = useState([])
  const [sesionId, setSesionId] = useState('')
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [lastResult, setLastResult] = useState(null) // { success: bool, msg: string, student: obj }
  const [processing, setProcessing] = useState(false)
  const [offlineCount, setOfflineCount] = useState(0)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncing, setSyncing] = useState(false)
  const [cachedStudents, setCachedStudents] = useState({})
  
  const scannerRef = useRef(null)
  const recentScansRef = useRef(new Map())
  
  // Referencias para evitar clausuras obsoletas en callbacks del escáner
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

  // 1. Cargar sesiones activas de hoy
  useEffect(() => {
    async function loadSessions() {
      try {
        const { data: jornada } = await supabase.from('jornadas').select('id').eq('estado', 'activa').single()
        if (!jornada) return
        
        const data = await sesionesService.getByJornada(jornada.id)
        
        // Filtrar estrictamente por las sesiones del día actual
        const hoy = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
        const sesionesHoy = (data || []).filter(s => s.dias_jornada?.fecha === hoy)
        
        setSesiones(sesionesHoy)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadSessions()
  }, [])

  // 2. Escuchar estado de conexión de red y cargar asistencias offline iniciales
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncOfflineCheckins()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const stored = localStorage.getItem('offline_checkins')
    if (stored) {
      setOfflineCount(JSON.parse(stored).length)
    }

    // Cargar caché local de estudiantes
    const storedStudents = localStorage.getItem('cached_students')
    if (storedStudents) {
      setCachedStudents(JSON.parse(storedStudents))
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 3. Precargar base de datos de estudiantes para verificación offline
  useEffect(() => {
    async function fetchAndCacheStudents() {
      try {
        const { data } = await supabase
          .from('estudiantes')
          .select('id, nombre, apellidos, matricula, programa_academico, telegram_chat_id')
        if (data) {
          const map = {}
          data.forEach(est => {
            map[est.id] = est
          })
          localStorage.setItem('cached_students', JSON.stringify(map))
          setCachedStudents(map)
        }
      } catch (err) {
        console.error('No se pudo precargar estudiantes en red. Usando caché existente:', err)
      }
    }
    if (isOnline) {
      fetchAndCacheStudents()
    }
  }, [isOnline])

  // 4. Lógica de registro de asistencias offline
  const registerOffline = (studentId, qrMatricula) => {
    let est = cachedStudentsRef.current[studentId]
    if (!est) {
      est = {
        id: studentId,
        nombre: 'Estudiante',
        apellidos: '(Modo Offline)',
        matricula: qrMatricula,
        programa_academico: 'Por confirmar en sincronización'
      }
    }

    const stored = localStorage.getItem('offline_checkins')
    const checkins = stored ? JSON.parse(stored) : []
    
    const yaRegistradoOffline = checkins.some(c => c.estudiante_id === studentId && c.sesion_id === sesionIdRef.current)
    if (yaRegistradoOffline) {
      setLastResult({ 
        success: false, 
        msg: 'Asistencia ya registrada localmente (Modo Offline)', 
        student: est 
      })
      return
    }

    const nuevoCheckin = {
      estudiante_id: studentId,
      sesion_id: sesionIdRef.current,
      hora_entrada: new Date().toLocaleTimeString('it-IT'),
      estudiante_datos: est
    }

    checkins.push(nuevoCheckin)
    localStorage.setItem('offline_checkins', JSON.stringify(checkins))
    setOfflineCount(checkins.length)

    setLastResult({
      success: true,
      msg: 'Asistencia guardada localmente (Modo Offline) ⏳',
      student: est
    })

    setTimeout(() => setLastResult(null), 4000)
  }

  // 5. Sincronizar asistencias pendientes con Supabase
  const syncOfflineCheckins = async () => {
    const stored = localStorage.getItem('offline_checkins')
    if (!stored) return
    const checkins = JSON.parse(stored)
    if (checkins.length === 0) return

    setSyncing(true)
    let syncs = 0
    const remaining = []

    for (const item of checkins) {
      try {
        const { data: exist } = await supabase
          .from('asistencias')
          .select('id')
          .eq('estudiante_id', item.estudiante_id)
          .eq('sesion_id', item.sesion_id)
          .maybeSingle()

        if (!exist) {
          const { error } = await supabase
            .from('asistencias')
            .insert([{
              estudiante_id: item.estudiante_id,
              sesion_id: item.sesion_id,
              hora_entrada: item.hora_entrada
            }])
          if (error) throw error
        }
        syncs++
      } catch (err) {
        console.error('Error sincronizando registro offline:', err)
        remaining.push(item)
      }
    }

    localStorage.setItem('offline_checkins', JSON.stringify(remaining))
    setOfflineCount(remaining.length)
    setSyncing(false)

    if (syncs > 0) {
      setLastResult({
        success: true,
        msg: `¡Sincronización exitosa! Se subieron ${syncs} asistencias. ✅`
      })
      setTimeout(() => setLastResult(null), 4000)
    }
  }

  // 6. Lógica de registro de asistencia al escanear
  const handleScanSuccess = async (decodedText) => {
    if (processingRef.current || !sesionIdRef.current) return
    
    // Cooldown de 5 segundos para evitar escaneos dobles rápidos del mismo QR
    const now = Date.now()
    if (recentScansRef.current.has(decodedText)) {
      if (now - recentScansRef.current.get(decodedText) < 5000) {
        return // Ignorar el mismo código si se escaneó hace menos de 5 segundos
      }
    }
    recentScansRef.current.set(decodedText, now)

    const parts = decodedText.split(':')
    if (parts[0] !== 'student' || parts.length < 2) {
      setLastResult({ success: false, msg: 'QR no válido para este sistema' })
      return
    }

    const studentId = parts[1]
    const qrMatricula = parts[2] || 'S/M'
    setProcessing(true)
    
    // Si no hay internet, ir directamente a registro offline
    if (!isOnlineRef.current) {
      setProcessing(false)
      registerOffline(studentId, qrMatricula)
      return
    }

    try {
      // A. Verificar si el alumno existe y obtener sus datos
      const { data: est, error: eErr } = await supabase
        .from('estudiantes')
        .select('*')
        .eq('id', studentId)
        .single()
      
      if (eErr || !est) throw new Error('Estudiante no encontrado')

      // B. Verificar si ya tiene asistencia en esta sesión
      const { data: exist } = await supabase
        .from('asistencias')
        .select('id')
        .eq('estudiante_id', studentId)
        .eq('sesion_id', sesionIdRef.current)
        .maybeSingle()
      
      if (exist) {
        setLastResult({ 
          success: false, 
          msg: 'Asistencia ya registrada anteriormente', 
          student: est 
        })
        return
      }

      // C. Registrar asistencia
      const { error: insErr } = await supabase
        .from('asistencias')
        .insert([{
          estudiante_id: studentId,
          sesion_id: sesionIdRef.current,
          hora_entrada: new Date().toLocaleTimeString('it-IT')
        }])
      
      if (insErr) throw insErr

      // Enviar confirmación de asistencia vía Telegram
      if (est.telegram_chat_id) {
        const sesionActual = sesionesRef.current.find(s => s.id === sesionIdRef.current);
        telegramService.sendMessage(
          est.telegram_chat_id,
          `✅ ¡Tu asistencia a "${sesionActual?.nombre}" ha sido registrada!\n\n🕐 Hora: ${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}\n\n¡Disfruta la sesión! 🎓`
        ).catch(console.error);

        // Verificar total de asistencias para constancia
        supabase
          .from('asistencias')
          .select('*', { count: 'exact', head: true })
          .eq('estudiante_id', studentId)
          .then(({ count, error }) => {
            if (!error && count === 6) {
              const appUrl = window.location.origin;
              telegramService.sendMessage(
                est.telegram_chat_id,
                `🎓 ¡Gran noticia!\n\nTu constancia de participación ya está disponible para descargar.\n\n📄 Descárgala desde: ${appUrl}/mi-agenda\n\n¡Felicidades por tu participación! 🏆`
              ).catch(console.error);
            }
          });
      }

      setLastResult({ 
        success: true, 
        msg: '¡Asistencia confirmada exitosamente!', 
        student: est 
      })

      setTimeout(() => setLastResult(null), 3500)

    } catch (err) {
      if (err.message.includes('fetch') || err.message.includes('Network') || err.message.includes('Failed')) {
        // Error de red detectado durante la consulta online, guardar localmente
        registerOffline(studentId, qrMatricula)
      } else {
        setLastResult({ success: false, msg: err.message })
      }
    } finally {
      setProcessing(false)
    }
  }

  // 3. Inicializar / Destruir Scanner
  useEffect(() => {
    let html5QrCode = null;

    async function startScanner() {
      if (scanning && sesionId) {
        await new Promise(r => setTimeout(r, 100));
        
        const element = document.getElementById("reader");
        if (!element) {
          console.error("No se encontró el elemento 'reader'");
          return;
        }

        html5QrCode = new Html5Qrcode("reader");

        try {
          await html5QrCode.start(
            { facingMode: "environment" }, 
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0
            },
            (decodedText) => {
              handleScanSuccess(decodedText)
            },
            (errorMessage) => {
              // Ignorar errores de "no se encuentra QR en frame"
            }
          );
          scannerRef.current = html5QrCode
        } catch (err) {
          console.error("Error al iniciar cámara:", err)
          setLastResult({ success: false, msg: "Error de cámara: Permite el acceso a la cámara en tu navegador." })
        }
      }
    }

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => {
          scannerRef.current.clear()
        }).catch(err => {
          console.warn("Error al detener el escáner:", err);
        })
        scannerRef.current = null
      }
    }
  }, [scanning, sesionId])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-[#1B4332]" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A1A11] pb-20">
      
      {/* Header */}
      <div className="bg-white dark:bg-[#122A1C] border-b border-gray-100 dark:border-emerald-900/40 px-4 py-4 sticky top-0 z-50">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-gray-100 dark:hover:bg-emerald-900/30 rounded-xl transition-all">
              <ArrowLeft size={20} className="text-gray-500" />
            </button>
            <div>
              <h1 className="font-black text-gray-900 dark:text-gray-100 leading-none">Punto de Control</h1>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1 flex items-center gap-1">
                <ShieldCheck size={10} /> Acceso Staff
              </p>
            </div>
          </div>
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center">
            <Users size={20} className="text-[#1B4332] dark:text-emerald-400" />
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-8 space-y-6">
        
        {/* Status de Conexión y Sincronización */}
        <div className="bg-white dark:bg-[#122A1C] rounded-[2rem] p-5 shadow-sm border border-gray-100 dark:border-emerald-900/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-3.5 h-3.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
            <div>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                Conexión: {isOnline ? 'En línea (Conectado)' : 'Modo Offline (Desconectado)'}
              </p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {offlineCount} {offlineCount === 1 ? 'asistencia pendiente' : 'asistencias pendientes'}
              </p>
            </div>
          </div>
          {offlineCount > 0 && (
            <button
              onClick={syncOfflineCheckins}
              disabled={syncing || !isOnline}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-200 dark:disabled:bg-emerald-950/20 text-white disabled:text-gray-400 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              {syncing ? (
                <><Loader2 size={12} className="animate-spin" /> Subiendo...</>
              ) : (
                <>Sincronizar ahora</>
              )}
            </button>
          )}
        </div>
        
        {/* 1. Selección de Sesión */}
        <div className="bg-white dark:bg-[#122A1C] rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-emerald-900/30">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-center">Configuración del Escáner</label>
          
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">Selecciona la sesión actual:</p>
              <select 
                value={sesionId}
                onChange={(e) => {
                  setSesionId(e.target.value)
                  setScanning(false)
                  setLastResult(null)
                }}
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#0F2018] border border-gray-100 dark:border-emerald-900/50 rounded-2xl outline-none focus:border-[#1B4332] text-sm font-bold dark:text-gray-200"
              >
                <option value="">— Elegir sesión —</option>
                {sesiones.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.hora_inicio?.slice(0,5)} · {s.nombre}
                  </option>
                ))}
              </select>
            </div>

            <button
              disabled={!sesionId}
              onClick={() => setScanning(!scanning)}
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3
                ${scanning 
                  ? 'bg-red-50 text-red-600 border border-red-100' 
                  : 'bg-[#1B4332] text-white shadow-lg shadow-emerald-900/20'}`}
            >
              {scanning ? <><XCircle size={18} /> Detener Cámara</> : <><Camera size={18} /> Iniciar Escáner</>}
            </button>
          </div>
        </div>

        {/* 2. Área del Escáner */}
        {scanning && sesionId && (
          <div className="relative anim-fade-up">
            <div id="reader" className="overflow-hidden rounded-[2.5rem] border-4 border-white dark:border-[#122A1C] shadow-2xl bg-black" />
            <div className="absolute inset-x-0 -bottom-3 flex justify-center">
              <span className="bg-[#1B4332] text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl">
                Cámara Activa
              </span>
            </div>
          </div>
        )}

        {/* 3. Resultado del Escaneo */}
        {lastResult && (
          <div className={`p-6 rounded-[2.5rem] border-2 shadow-2xl anim-scale-in transition-all
            ${lastResult.success 
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50' 
              : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'}`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm
                ${lastResult.success ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                {lastResult.success ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-lg font-black leading-tight mb-1 ${lastResult.success ? 'text-emerald-900 dark:text-emerald-400' : 'text-red-900 dark:text-red-400'}`}>
                  {lastResult.msg}
                </h3>
                {lastResult.student && (
                  <div className="mt-4 p-4 bg-white/50 dark:bg-black/20 rounded-2xl border border-white/40">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Identificación</p>
                    <p className="font-black text-gray-800 dark:text-gray-100 text-base">{lastResult.student.nombre} {lastResult.student.apellidos}</p>
                    <div className="flex gap-4 mt-2">
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Matrícula</p>
                        <p className="font-bold text-gray-700 dark:text-gray-300 text-xs">{lastResult.student.matricula}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Carrera</p>
                        <p className="font-bold text-gray-700 dark:text-gray-300 text-xs uppercase">{lastResult.student.programa_academico?.slice(0,10)}...</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info Session actual si está escaneando */}
        {scanning && !lastResult && sesionId && (
          <div className="bg-gray-100 dark:bg-[#122A1C] p-6 rounded-[2rem] text-center border border-gray-200 dark:border-emerald-900/20 anim-fade-up">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Escaneando para:</p>
            <h2 className="text-sm font-black text-[#1B4332] dark:text-emerald-400">
              {sesiones.find(s => s.id === sesionId)?.nombre}
            </h2>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500 font-bold">
              <span className="flex items-center gap-1.5"><Clock size={12} /> {sesiones.find(s => s.id === sesionId)?.hora_inicio?.slice(0,5)} hrs</span>
              <span className="flex items-center gap-1.5"><MapPin size={12} /> {sesiones.find(s => s.id === sesionId)?.escenarios?.nombre || 'UES SJR'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Loader Overlay for Processing */}
      {processing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100] flex items-center justify-center">
          <div className="bg-white dark:bg-[#122A1C] p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-emerald-500/20">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Validando Acceso...</p>
          </div>
        </div>
      )}

    </div>
  )
}

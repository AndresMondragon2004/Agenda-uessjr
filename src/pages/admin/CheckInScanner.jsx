import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { 
  Camera, CheckCircle2, XCircle, Users, 
  ArrowLeft, Loader2, UserCheck, MapPin, 
  Clock, AlertTriangle, ShieldCheck
} from 'lucide-react'
import { supabase } from '../../services/supabase'
import { sesionesService } from '../../services/sesiones.service'

export default function CheckInScanner() {
  const navigate = useNavigate()
  const [sesiones, setSesiones] = useState([])
  const [sesionId, setSesionId] = useState('')
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [lastResult, setLastResult] = useState(null) // { success: bool, msg: string, student: obj }
  const [processing, setProcessing] = useState(false)
  
  const scannerRef = useRef(null)

  // 1. Cargar sesiones activas de hoy para el selector
  useEffect(() => {
    async function loadSessions() {
      try {
        const { data: jornada } = await supabase.from('jornadas').select('id').eq('estado', 'activa').single()
        if (!jornada) return
        
        const data = await sesionesService.getByJornada(jornada.id)
        // Ordenar: primero las que están por empezar o en curso hoy
        setSesiones(data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadSessions()
  }, [])

  // 2. Lógica de registro de asistencia
  const handleScanSuccess = async (decodedText) => {
    if (processing || !sesionId) return
    
    // El formato del QR es "student:[id]:[matricula]"
    const parts = decodedText.split(':')
    if (parts[0] !== 'student' || parts.length < 2) {
      setLastResult({ success: false, msg: 'QR no válido para este sistema' })
      return
    }

    const studentId = parts[1]
    setProcessing(true)
    
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
        .eq('sesion_id', sesionId)
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
          sesion_id: sesionId,
          hora_entrada: new Date().toLocaleTimeString('it-IT') // HH:mm:ss
        }])
      
      if (insErr) throw insErr

      setLastResult({ 
        success: true, 
        msg: '¡Asistencia confirmada exitosamente!', 
        student: est 
      })

      // Limpiar resultado después de 3 segundos
      setTimeout(() => setLastResult(null), 3500)

    } catch (err) {
      setLastResult({ success: false, msg: err.message })
    } finally {
      setProcessing(false)
    }
  }

  // 3. Inicializar / Destruir Scanner
  useEffect(() => {
    if (scanning && sesionId && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner("reader", { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      }, false)

      scanner.render(handleScanSuccess, (err) => {
        // Ignorar errores de "no se encuentra QR en frame"
      })
      scannerRef.current = scanner
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error)
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

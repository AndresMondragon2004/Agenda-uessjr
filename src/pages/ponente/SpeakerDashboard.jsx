import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { 
  MessageSquare, Users, ScanLine, LogOut, CheckCircle2, XCircle, 
  Clock, Send, Check, Loader2, Star, TrendingUp, BarChart3, 
  FileText, Download, Save, ExternalLink, ArrowRight, Share2, Sparkles, MapPin, Award, Upload, Link as LinkIcon, Sun, Moon
} from 'lucide-react'
import { supabase } from '../../services/supabase'
import SEO from '../../components/SEO'

const PROGRAMA_LABELS = {
  sistemas:            'ISC',
  innovacion_agricola: 'IIAS',
  contaduria:          'LC',
  publico_general:     'Gral',
}

const PROGRAMA_COLORS = {
  sistemas:            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  innovacion_agricola: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  contaduria:          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  publico_general:     'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
}

export default function SpeakerDashboard() {
  const { token } = useParams()
  const navigate = useNavigate()
  
  const [sesion, setSesion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [activeTab, setActiveTab] = useState('overview')
  const [preguntas, setPreguntas] = useState([])
  const [feedback, setFeedback] = useState([])
  const [scanResult, setScanResult] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [savingMaterial, setSavingMaterial] = useState(false)
  
  const [materialUrl, setMaterialUrl] = useState('')
  const [materialNombre, setMaterialNombre] = useState('')
  const [uploadMode, setUploadMode] = useState('link')
  const [uploadingFile, setUploadingFile] = useState(false)
  
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('uessjr-dark')
      if (saved !== null) return saved === 'true'
    } catch (e) {}
    return document.documentElement.classList.contains('dark')
  })

  const scannerRef = useRef(null)

  const toggleDark = () => {
    const next = !darkMode
    setDarkMode(next)
    if (next) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    try { localStorage.setItem('uessjr-dark', String(next)) } catch (e) {}
  }

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!token || !uuidRegex.test(token)) throw new Error("Formato de código inválido.")

      const { data, error: rpcError } = await supabase.rpc('get_sesion_by_ponente_token', { p_token: token })
      if (rpcError) throw rpcError
      if (!data || data.length === 0) throw new Error("Token inválido o expirado.")
      
      const s = data[0]
      setSesion(s)
      
      if (!isRefresh) {
        setMaterialUrl(s.material_url || '')
        setMaterialNombre(s.material_nombre || '')
      }

      const { data: qData } = await supabase.from('sesion_preguntas').select('id, pregunta, estado, votos, estudiantes(nombre, apellidos)').eq('sesion_id', s.id).order('votos', { ascending: false }).order('created_at', { ascending: false })
      if (qData) setPreguntas(qData)

      const { data: fData } = await supabase.from('valoraciones').select('id, estrellas, comentario, created_at, estudiantes(nombre, apellidos)').eq('sesion_id', s.id).order('created_at', { ascending: false })
      if (fData) setFeedback(fData)

    } catch (err) {
      setError(err.message)
    } finally {
      if (!isRefresh) setLoading(false)
    }
  }, [token])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (!sesion?.id) return
    const channel = supabase.channel(`speaker_realtime:${sesion.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inscripciones', filter: `sesion_id=eq.${sesion.id}` }, () => { loadData(true) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sesion_preguntas', filter: `sesion_id=eq.${sesion.id}` }, () => { loadData(true) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'valoraciones', filter: `sesion_id=eq.${sesion.id}` }, () => { loadData(true) })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [sesion?.id, loadData])

  useEffect(() => {
    let isM = true, q = null
    async function start() {
      if (scanning && sesion?.id) {
        await new Promise(r => setTimeout(r, 100))
        if (!isM) return
        q = new Html5Qrcode("speaker-reader")
        try {
          await q.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 }, (txt) => handleScan(txt), () => {})
          if (!isM) q.stop().then(() => q.clear()).catch(() => {})
          else scannerRef.current = q
        } catch (err) { setScanResult({ type: 'error', msg: "Error de cámara" }) }
      }
    }
    start()
    return () => {
      isM = false
      if (scannerRef.current) { scannerRef.current.stop().then(() => scannerRef.current.clear()).catch(() => {}); scannerRef.current = null }
    }
  }, [scanning, sesion?.id])

  const handleLogout = () => navigate('/ponente/login')

  const handleScan = async (decodedText) => {
    if (decodedText && !scanning) {
      setScanning(true)
      try {
        if (decodedText.startsWith('student:')) {
          const qrToken = decodedText.split(':')[1]
          const { data: estData } = await supabase.from('estudiantes').select('id, nombre').eq('qr_token', qrToken).single()
          if (!estData) return setScanResult({ type: 'error', msg: 'Estudiante no encontrado.' })
          const { error: insErr } = await supabase.from('asistencias').insert([{ sesion_id: sesion.id, estudiante_id: estData.id }])
          if (insErr && insErr.code === '23505') setScanResult({ type: 'success', msg: `${estData.nombre} ya tenía asistencia.` })
          else if (insErr) throw insErr
          else { setScanResult({ type: 'success', msg: `Asistencia de ${estData.nombre} registrada.` }); loadData(true) }
        } else setScanResult({ type: 'error', msg: 'QR no válido.' })
      } catch (err) { setScanResult({ type: 'error', msg: 'Error: ' + err.message }) }
      finally { setTimeout(() => setScanning(false), 2000) }
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      setUploadingFile(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${sesion.id}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `support-materials/${fileName}`
      const { error: uploadError } = await supabase.storage.from('materiales').upload(filePath, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('materiales').getPublicUrl(filePath)
      setMaterialUrl(publicUrl)
      if (!materialNombre) setMaterialNombre(file.name)
      alert('Archivo subido con éxito.')
    } catch (err) { alert('Error al subir: ' + err.message) }
    finally { setUploadingFile(false) }
  }

  const handleSaveMaterial = async () => {
    try {
      setSavingMaterial(true)
      const { error } = await supabase.from('sesiones').update({ material_url: materialUrl, material_nombre: materialNombre }).eq('id', sesion.id)
      if (error) throw error
      setSesion({ ...sesion, material_url: materialUrl, material_nombre: materialNombre })
      alert('Material actualizado.')
    } catch (err) { alert('Error al guardar: ' + err.message) }
    finally { setSavingMaterial(false) }
  }

  const updatePreguntaEstado = async (id, estado) => {
    await supabase.from('sesion_preguntas').update({ estado }).eq('id', id)
    loadData(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0A1A11] flex flex-col font-sans">
        {/* Skeleton Header */}
        <div className="bg-[#001F12] p-6 sm:p-14 pb-20 sm:pb-28">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="h-4 w-32 bg-emerald-800/50 rounded-full animate-pulse"></div>
            <div className="h-10 sm:h-14 w-3/4 sm:w-1/2 bg-emerald-800/50 rounded-2xl animate-pulse"></div>
            <div className="h-5 w-48 bg-emerald-800/50 rounded-lg animate-pulse mt-4"></div>
          </div>
        </div>
        {/* Skeleton Tabs */}
        <div className="bg-white dark:bg-[#122A1C] border-b border-gray-100 dark:border-emerald-900/30 shadow-sm -mt-6">
          <div className="max-w-7xl mx-auto px-4 py-5 flex gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-4 w-24 bg-gray-200 dark:bg-emerald-900/40 rounded animate-pulse hidden sm:block" />
            ))}
            <div className="h-4 w-24 bg-gray-200 dark:bg-emerald-900/40 rounded animate-pulse sm:hidden" />
          </div>
        </div>
        {/* Skeleton Content */}
        <div className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-[#122A1C] p-8 rounded-[2.5rem] h-40 border border-gray-100 dark:border-emerald-900/20 flex flex-col justify-between">
                <div className="h-12 w-12 bg-gray-100 dark:bg-emerald-900/30 rounded-2xl animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-gray-200 dark:bg-emerald-900/40 rounded animate-pulse" />
                  <div className="h-8 w-16 bg-gray-200 dark:bg-emerald-900/40 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !sesion) return <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#F2F5F3] dark:bg-[#0A1A11]"><XCircle className="text-red-500 w-16 h-16 mb-4" /><h2 className="text-2xl font-black text-gray-900 dark:text-white">Error de acceso</h2><p className="text-gray-500 dark:text-gray-400 mt-2 text-justify">{error}</p><button onClick={handleLogout} className="mt-8 px-8 py-3 bg-[#1B4332] text-white rounded-2xl font-bold">Volver</button></div>

  return (
    <>
      <SEO title={`Speaker: ${sesion.nombre}`} />
      <div className="min-h-screen bg-[#F2F5F3] dark:bg-[#0A1A11] flex flex-col font-sans">
        <header className="bg-[#001F12] text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
          <div className="max-w-7xl mx-auto px-6 py-10 sm:py-14 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-4">
                <span className="bg-emerald-500 text-[#001F12] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Ponente verificado</span>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none text-white max-w-3xl">{sesion.nombre}</h1>
                <p className="flex items-center gap-2 text-emerald-100/60 font-medium"><Clock size={16} className="text-emerald-500" /> {sesion.hora_inicio?.slice(0,5)} — {sesion.hora_fin?.slice(0,5)} hrs</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleDark}
                  aria-label={darkMode ? 'Modo claro' : 'Modo oscuro'}
                  className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-emerald-100/80 hover:text-white transition-all active:scale-95"
                >
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button onClick={handleLogout} className="group flex items-center gap-3 bg-white/5 hover:bg-red-500/10 border border-white/10 px-6 py-3 rounded-2xl transition-all active:scale-95">
                  <LogOut size={18} className="text-white/40 group-hover:text-red-500" />
                  <span className="text-sm font-bold group-hover:text-red-500">Cerrar sesión</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="bg-white dark:bg-[#122A1C] border-b border-gray-100 dark:border-emerald-900/30 sticky top-0 z-20 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 flex gap-8 overflow-x-auto scrollbar-hide">
            {[
              { id: 'overview', label: 'Impacto & resumen', icon: TrendingUp },
              { id: 'qa', label: 'Preguntas en vivo', icon: MessageSquare, count: preguntas.filter(p => p.estado === 'pendiente').length },
              { id: 'scan', label: 'Control de acceso', icon: ScanLine },
              { id: 'resources', label: 'Material de apoyo', icon: FileText },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-5 px-1 border-b-4 font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2.5 whitespace-nowrap ${activeTab === tab.id ? 'border-[#1B4332] dark:border-emerald-500 text-[#1B4332] dark:text-emerald-400' : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>{tab.icon && <tab.icon size={16} />} {tab.label} {tab.count > 0 && <span className="bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] animate-pulse">{tab.count}</span>}</button>
            ))}
          </div>
        </div>

        <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-10">
          {activeTab === 'overview' && (
            <div className="space-y-10 anim-fade-up">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-[#122A1C] p-8 rounded-[2.5rem] shadow-xl border border-white dark:border-emerald-900/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-12 translate-x-12" />
                  <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center text-[#1B4332] dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform"><Users size={28} /></div>
                  <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Audiencia Total</h3>
                  <p className="text-4xl font-black text-gray-900 dark:text-white">{sesion.total_inscritos}</p>
                </div>
                <div className="bg-white dark:bg-[#122A1C] p-8 rounded-[2.5rem] shadow-xl border border-white dark:border-emerald-900/20 relative overflow-hidden group">
                  <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/40 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6 group-hover:scale-110 transition-transform"><Star size={28} /></div>
                  <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Impacto (Rating)</h3>
                  <div className="flex items-end gap-2"><p className="text-4xl font-black text-gray-900 dark:text-white">{(sesion.rating_avg || 0).toFixed(1)}</p><div className="flex text-amber-400 mb-1.5">{[1,2,3,4,5].map(s => <Star key={s} size={12} fill={s <= (sesion.rating_avg || 0) ? "currentColor" : "none"} />)}</div></div>
                  <p className="text-xs text-gray-500 mt-2 font-bold uppercase tracking-widest">{sesion.rating_count} valoraciones</p>
                </div>
                <div className="bg-white dark:bg-[#122A1C] p-8 rounded-[2.5rem] shadow-xl border border-white dark:border-emerald-900/20 relative overflow-hidden group">
                  <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform"><BarChart3 size={28} /></div>
                  <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Interacción</h3>
                  <p className="text-4xl font-black text-gray-900 dark:text-white">{preguntas.length}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-[#122A1C] rounded-[2.5rem] p-8 shadow-xl border border-white dark:border-emerald-900/20">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3"><TrendingUp className="text-emerald-500" /> Distribución por carrera</h3>
                  <div className="space-y-6">
                    {Object.entries(sesion.stats_carreras || {}).length === 0 ? (
                      <p className="text-center py-10 text-gray-400 font-bold italic text-sm">Esperando registros...</p>
                    ) : (
                      Object.entries(sesion.stats_carreras).map(([carrera, count]) => {
                        const pct = (count / sesion.total_inscritos) * 100
                        return (
                          <div key={carrera} className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest"><span className="text-gray-500">{PROGRAMA_LABELS[carrera] || carrera}</span><span className="text-[#1B4332] dark:text-emerald-400">{count} alumnos ({Math.round(pct)}%)</span></div>
                            <div className="h-3 bg-gray-50 dark:bg-black/40 rounded-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${PROGRAMA_COLORS[carrera] || 'bg-[#1B4332]'}`} style={{ width: `${pct}%` }} /></div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
                <div className="bg-white dark:bg-[#122A1C] rounded-[2.5rem] p-8 shadow-xl border border-white dark:border-emerald-900/20">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3"><Award className="text-amber-500" /> Reseñas de alumnos</h3>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 scrollbar-hide">
                    {feedback.length === 0 ? ( <p className="text-center py-10 text-gray-400 font-bold italic text-sm">Aún no hay comentarios.</p> ) : (
                      feedback.map(f => (
                        <div key={f.id} className="p-5 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-emerald-900/10">
                          <div className="flex justify-between items-start mb-2"><span className="text-xs font-black text-gray-900 dark:text-white">{f.estudiantes?.nombre}</span><div className="flex text-amber-400">{[1,2,3,4,5].map(s => <Star key={s} size={10} fill={s <= f.estrellas ? "currentColor" : "none"} />)}</div></div>
                          <p className="text-gray-600 dark:text-gray-400 text-xs italic font-medium text-justify">"{f.comentario || 'Sin comentario'}"</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'qa' && (
            <div className="bg-white dark:bg-[#122A1C] rounded-[3rem] shadow-2xl border border-white dark:border-emerald-900/20 overflow-hidden anim-fade-up">
              <div className="p-8 sm:p-10 border-b border-gray-100 dark:border-emerald-900/30 flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Preguntas del auditorio</h2>
                <span className="bg-[#1B4332] text-white px-5 py-2 rounded-2xl text-xs font-black shadow-lg shadow-emerald-900/20">{preguntas.length} TOTALES</span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-emerald-900/20">
                {preguntas.length === 0 ? (
                  <div className="py-24 text-center"><p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Sin preguntas por ahora</p></div>
                ) : (
                  preguntas.map((p) => (
                    <div key={p.id} className={`p-8 flex flex-col sm:flex-row gap-6 sm:items-center justify-between transition-all ${p.estado === 'respondida' ? 'opacity-40 grayscale bg-gray-50 dark:bg-black/20' : 'hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10'}`}>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3"><span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">De: {p.estudiantes?.nombre}</span><span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] font-black">{p.votos} VOTOS</span></div>
                        <p className="text-gray-800 dark:text-gray-100 font-black text-lg leading-tight tracking-tight">{p.pregunta}</p>
                      </div>
                      {p.estado === 'pendiente' && ( <button onClick={() => updatePreguntaEstado(p.id, 'respondida')} className="shrink-0 flex items-center justify-center gap-2 px-6 py-3 bg-[#1B4332] hover:bg-emerald-800 text-white rounded-2xl text-xs font-black shadow-xl shadow-emerald-950/20 active:scale-95"><Check size={16} /> LISTO</button> )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'scan' && (
            <div className="max-w-lg mx-auto anim-fade-up">
              <div className="bg-white dark:bg-[#122A1C] rounded-[3rem] shadow-2xl border-4 border-white dark:border-emerald-900/30 p-10 text-center">
                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner"><ScanLine size={32} className="text-[#1B4332] dark:text-emerald-400" /></div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Registro directo</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-10 px-4 text-justify">Puedes registrar la asistencia de los alumnos escaneando su ticket digital.</p>
                <div className="relative rounded-[2.5rem] overflow-hidden bg-black aspect-square mb-10 border-8 border-gray-50 dark:border-black shadow-2xl">
                  {!scanning ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8"><Sparkles size={48} className="text-emerald-500/20 mb-6" /><button onClick={() => setScanning(true)} className="w-full py-4 bg-[#1B4332] text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-950/20">Iniciar Escáner</button></div>
                  ) : (
                    <>
                      <div id="speaker-reader" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 pointer-events-none border-[3px] border-emerald-500/40 m-12 rounded-3xl" />
                      <button onClick={() => setScanning(false)} className="absolute bottom-6 left-1/2 -translate-x-1/2 px-8 py-3 bg-red-600 text-white rounded-full text-[10px] font-black uppercase shadow-2xl">Detener</button>
                    </>
                  )}
                </div>
                {scanResult && <div className={`p-6 rounded-[2rem] text-sm font-black uppercase shadow-lg ${scanResult.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-600 text-white'}`}>{scanResult.msg}</div>}
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="max-w-2xl mx-auto anim-fade-up">
              <div className="bg-white dark:bg-[#122A1C] rounded-[3rem] p-10 shadow-2xl border border-white dark:border-emerald-900/20">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Material didáctico</h2>
                <div className="flex gap-2 p-1 bg-gray-50 dark:bg-black/20 rounded-2xl mb-8">
                  <button onClick={() => setUploadMode('link')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${uploadMode === 'link' ? 'bg-[#1B4332] text-white shadow-lg' : 'text-gray-400'}`}><LinkIcon size={14} /> Enlace</button>
                  <button onClick={() => setUploadMode('file')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${uploadMode === 'file' ? 'bg-[#1B4332] text-white shadow-lg' : 'text-gray-400'}`}><Upload size={14} /> Archivo</button>
                </div>
                <div className="space-y-6">
                  {uploadMode === 'link' ? (
                    <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1">URL del material</label><div className="relative"><ExternalLink className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="url" value={materialUrl} onChange={(e) => setMaterialUrl(e.target.value)} placeholder="https://..." className="w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-black/20 border border-gray-100 rounded-2xl outline-none font-bold text-sm" /></div></div>
                  ) : (
                    <div className="border-4 border-dashed border-gray-100 dark:border-emerald-900/30 rounded-[2rem] p-8 text-center relative hover:border-emerald-500 transition-colors">
                      {uploadingFile ? ( <div className="py-4"><Loader2 className="animate-spin text-[#1B4332] mx-auto mb-3" size={32} /><p className="text-xs font-black uppercase">Subiendo...</p></div> ) : (
                        <> <Upload className="w-10 h-10 text-gray-300 mx-auto mb-4" /><p className="text-xs font-bold text-gray-500 mb-2">Selecciona un archivo</p><input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" /> {materialUrl && uploadMode === 'file' && <p className="text-[10px] text-emerald-500 font-black mt-2">✓ ARCHIVO LISTO</p>} </>
                      )}
                    </div>
                  )}
                  <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-3 ml-1">Nombre del material</label><div className="relative"><FileText className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" value={materialNombre} onChange={(e) => setMaterialNombre(e.target.value)} placeholder="Ej: Diapositivas" className="w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-black/20 border border-gray-100 rounded-2xl outline-none font-bold text-sm" /></div></div>
                  <button onClick={handleSaveMaterial} disabled={savingMaterial || uploadingFile || !materialUrl} className="w-full py-5 bg-[#1B4332] text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl transition-all disabled:opacity-50">Publicar Material</button>
                </div>
              </div>
            </div>
          )}
        </main>
        <footer className="p-8 text-center text-gray-400 mt-auto"><p className="text-[10px] font-black uppercase tracking-[0.3em]">UESSJR • Portal para Ponentes v2.2</p></footer>
      </div>
    </>
  )
}

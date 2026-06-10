import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { 
  MessageSquare, Users, ScanLine, LogOut, CheckCircle2, XCircle, 
  Clock, Send, Check, Loader2, Star, TrendingUp, BarChart3, 
  FileText, Download, Save, ExternalLink, ArrowRight, Share2, Sparkles, MapPin, Award, Upload, Link as LinkIcon, Sun, Moon,
  MonitorPlay, Heart, Briefcase, Plus, X, BarChart, ChevronLeft, Trash2
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
  const [networkingLeads, setNetworkingLeads] = useState([])
  const [encuestas, setEncuestas] = useState([])
  
  const [scanResult, setScanResult] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [savingMaterial, setSavingMaterial] = useState(false)
  const [uploadMode, setUploadMode] = useState('link')
  const [uploadingFile, setUploadingFile] = useState(false)
  const [materialUrl, setMaterialUrl] = useState('')
  const [materialNombre, setMaterialNombre] = useState('')
  
  // Novedades Pro
  const [presentationMode, setPresentationMode] = useState(false)
  const [reactions, setReactions] = useState([])

  const [showPollModal, setShowPollModal] = useState(false)
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState(['Sí', 'No'])
  const [creandoEncuesta, setCreandoEncuesta] = useState(false)

  
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
    if (next) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
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

      // Preguntas
      const { data: qData } = await supabase.from('sesion_preguntas').select('id, pregunta, estado, votos, estudiantes(nombre, apellidos)').eq('sesion_id', s.id).order('votos', { ascending: false }).order('created_at', { ascending: false })
      if (qData) setPreguntas(qData)

      // Feedback
      const { data: fData } = await supabase.from('valoraciones').select('id, estrellas, comentario, created_at, estudiantes(nombre, apellidos)').eq('sesion_id', s.id).order('created_at', { ascending: false })
      if (fData) setFeedback(fData)

      // Networking
      const { data: nData } = await supabase.from('sesion_networking').select('created_at, estudiantes(nombre, apellidos, correo, programa_academico)').eq('sesion_id', s.id).order('created_at', { ascending: false })
      if (nData) setNetworkingLeads(nData)
      
      // Encuestas
      const { data: eData } = await supabase.from('sesion_encuestas').select('*').eq('sesion_id', s.id).order('created_at', { ascending: false })
      if (eData) setEncuestas(eData)

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sesion_networking', filter: `sesion_id=eq.${sesion.id}` }, () => { loadData(true) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sesion_encuestas', filter: `sesion_id=eq.${sesion.id}` }, () => { loadData(true) })
      .on('broadcast', { event: 'reaction' }, (payload) => {
        const { type } = payload.payload
        const id = Math.random().toString()
        const x = Math.floor(Math.random() * 80) + 10 // 10% to 90%
        setReactions(prev => [...prev, { id, type, x }])
        setTimeout(() => {
          setReactions(prev => prev.filter(r => r.id !== id))
        }, 3000)
      })
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
    // Actualización optimista para que la interfaz reaccione al instante (0ms)
    setPreguntas(prev => prev.map(p => p.id === id ? { ...p, estado } : p))
    
    if (estado === 'respondida') {
      await supabase.rpc('marcar_pregunta_respondida', { p_pregunta_id: id })
    } else {
      // Por si se usa para otros estados en el futuro, aunque la DB bloqueará si no hay RPC
      await supabase.from('sesion_preguntas').update({ estado }).eq('id', id)
    }
    loadData(true)
  }

  const downloadCSV = () => {
    if (networkingLeads.length === 0) return
    const headers = ["Nombre", "Apellidos", "Correo", "Programa", "Fecha de Conexion"]
    const rows = networkingLeads.map(l => [
      l.estudiantes?.nombre || '',
      l.estudiantes?.apellidos || '',
      l.estudiantes?.correo || '',
      PROGRAMA_LABELS[l.estudiantes?.programa_academico] || l.estudiantes?.programa_academico || '',
      new Date(l.created_at).toLocaleString()
    ])
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.map(f => `"${f}"`).join(",")).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Leads_${sesion.nombre.replace(/ /g, '_')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCreatePoll = async () => {
    if (!pollQuestion.trim() || pollOptions.length < 2) return
    
    try {
      setCreandoEncuesta(true)
      const opcionesEstructuradas = pollOptions.filter(o => o.trim() !== '').map(opt => ({
        texto: opt.trim(),
        votos: 0
      }))

      if (opcionesEstructuradas.length < 2) {
        alert("Debes tener al menos 2 opciones válidas.")
        return
      }

      await supabase.from('sesion_encuestas').insert([{
        sesion_id: sesion.id,
        pregunta: pollQuestion.trim(),
        opciones: opcionesEstructuradas
      }])
      
      setShowPollModal(false)
      setPollQuestion('')
      setPollOptions(['Sí', 'No'])
      loadData(true)
    } catch (e) { 
      alert('Error: ' + e.message) 
    } finally {
      setCreandoEncuesta(false)
    }
  }

  const handleClosePoll = async (id) => {
    await supabase.from('sesion_encuestas').update({ estado: 'cerrada' }).eq('id', id)
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

  if (error || !sesion) return <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#F2F5F3] dark:bg-[#0A1A11]"><XCircle className="text-red-500 w-16 h-16 mb-4" /><h2 className="text-2xl font-black text-gray-900 dark:text-white">Error de acceso</h2><p className="text-gray-500 dark:text-gray-400 mt-2 text-justify">{error}</p><button onClick={handleLogout} className="mt-8 px-8 py-3 bg-[#22573E] text-white rounded-2xl font-bold">Volver</button></div>

  if (presentationMode) {
    const topQuestion = preguntas.filter(p => p.estado === 'pendiente')[0]
    return (
      <div className="fixed inset-0 bg-black text-white flex flex-col z-[100] p-10 font-sans">
        <button onClick={() => setPresentationMode(false)} className="absolute top-8 left-8 text-white/50 hover:text-white flex items-center gap-2 font-bold"><ChevronLeft /> Salir</button>
        <div className="absolute top-8 right-8 text-white/30 font-black uppercase tracking-widest text-sm flex items-center gap-3">
          <Users size={16} /> {sesion.total_inscritos} <span className="opacity-50">|</span> <Heart size={16} /> {reactions.length}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto text-center">
          {topQuestion ? (
            <>
              <span className="text-emerald-500 font-black uppercase tracking-[0.3em] mb-8 text-xl">Top Pregunta de la Audiencia</span>
              <h2 className="text-5xl sm:text-7xl font-black leading-tight mb-12">{topQuestion.pregunta}</h2>
              <div className="flex items-center gap-4 text-gray-400 font-bold text-2xl">
                <span>Por: {topQuestion.estudiantes?.nombre}</span>
                <span className="px-4 py-1 bg-white/10 rounded-full text-emerald-400">{topQuestion.votos} Votos</span>
              </div>
              <button onClick={() => updatePreguntaEstado(topQuestion.id, 'respondida')} className="mt-20 px-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] font-black text-2xl uppercase tracking-widest shadow-2xl transition-all active:scale-95">Marcar como respondida</button>
            </>
          ) : (
             <h2 className="text-4xl text-gray-600 font-black uppercase tracking-widest">No hay preguntas pendientes</h2>
          )}
        </div>
        
        {/* Render Reactions in Presentation Mode too */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          {reactions.map(r => (
            <div key={r.id} className="absolute bottom-0 text-6xl animate-float-up" style={{ left: `${r.x}%` }}>
              {r.type === 'clap' ? '👏' : r.type === 'mindblown' ? '🤯' : '❤️'}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <SEO title={`Speaker: ${sesion.nombre}`} />
      <div className="min-h-screen bg-[#F2F5F3] dark:bg-[#0A1A11] flex flex-col font-sans relative overflow-hidden">
        
        {/* Render Reactions */}
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {reactions.map(r => (
            <div key={r.id} className="absolute bottom-0 text-4xl sm:text-6xl animate-float-up" style={{ left: `${r.x}%` }}>
              {r.type === 'clap' ? '👏' : r.type === 'mindblown' ? '🤯' : '❤️'}
            </div>
          ))}
        </div>

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
                  <span className="text-sm font-bold group-hover:text-red-500 hidden sm:inline">Cerrar sesión</span>
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
              { id: 'polls', label: 'Encuestas', icon: BarChart, count: encuestas.filter(e => e.estado === 'activa').length },
              { id: 'networking', label: 'Networking', icon: Briefcase, count: networkingLeads.length },
              { id: 'scan', label: 'Control de acceso', icon: ScanLine },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-5 px-1 border-b-4 font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2.5 whitespace-nowrap ${activeTab === tab.id ? 'border-[#22573E] dark:border-emerald-500 text-[#22573E] dark:text-emerald-400' : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>{tab.icon && <tab.icon size={16} />} {tab.label} {tab.count > 0 && <span className="bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] animate-pulse">{tab.count}</span>}</button>
            ))}
          </div>
        </div>

        <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-10">
          {activeTab === 'overview' && (
            <div className="space-y-10 anim-fade-up">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-[#122A1C] p-8 rounded-[2.5rem] shadow-xl border border-white dark:border-emerald-900/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-12 translate-x-12" />
                  <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center text-[#22573E] dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform"><Users size={28} /></div>
                  <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Audiencia Total</h3>
                  <p className="text-4xl font-black text-gray-900 dark:text-white">{sesion.total_inscritos}</p>
                </div>
                <div className="bg-white dark:bg-[#122A1C] p-8 rounded-[2.5rem] shadow-xl border border-white dark:border-emerald-900/20 relative overflow-hidden group">
                  <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/40 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6 group-hover:scale-110 transition-transform"><Star size={28} /></div>
                  <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Impacto (Rating)</h3>
                  <div className="flex items-end gap-2"><p className="text-4xl font-black text-gray-900 dark:text-white">{(sesion.rating_avg || 0).toFixed(1)}</p><div className="flex text-amber-400 mb-1.5">{[1,2,3,4,5].map(s => <Star key={s} size={12} fill={s <= (sesion.rating_avg || 0) ? "currentColor" : "none"} />)}</div></div>
                  <p className="text-xs text-gray-500 mt-2 font-bold uppercase tracking-widest">{sesion.rating_count} valoraciones</p>
                </div>
                <div className="bg-[#22573E] dark:bg-emerald-900 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group flex flex-col justify-center items-center text-center">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#0A1A11] to-transparent opacity-50" />
                  <MonitorPlay size={40} className="text-emerald-400 mb-4 relative z-10" />
                  <button onClick={() => setPresentationMode(true)} className="relative z-10 w-full py-4 bg-white text-[#22573E] hover:bg-emerald-50 rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-2xl transition-all active:scale-95">Modo Escenario</button>
                  <p className="text-emerald-300 text-[10px] font-medium uppercase mt-4 relative z-10">Vista libre de distracciones</p>
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
                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest"><span className="text-gray-500">{PROGRAMA_LABELS[carrera] || carrera}</span><span className="text-[#22573E] dark:text-emerald-400">{count} alumnos ({Math.round(pct)}%)</span></div>
                            <div className="h-3 bg-gray-50 dark:bg-black/40 rounded-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${PROGRAMA_COLORS[carrera] || 'bg-[#22573E]'}`} style={{ width: `${pct}%` }} /></div>
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
                <div className="flex gap-4">
                  <button onClick={() => setPresentationMode(true)} className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 px-5 py-2 rounded-2xl text-xs font-black flex items-center gap-2"><MonitorPlay size={14} /> Modo Escenario</button>
                  <span className="bg-[#22573E] text-white px-5 py-2 rounded-2xl text-xs font-black shadow-lg shadow-emerald-900/20">{preguntas.length} TOTALES</span>
                </div>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-emerald-900/20">
                {preguntas.length === 0 ? (
                  <div className="py-24 text-center"><p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Sin preguntas por ahora</p></div>
                ) : (
                  preguntas.map((p) => (
                    <div key={p.id} className={`p-8 flex flex-col sm:flex-row gap-6 sm:items-center justify-between transition-all ${p.estado === 'respondida' ? 'opacity-40 grayscale bg-gray-50 dark:bg-black/20' : 'hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10'}`}>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3"><span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">De: {p.estudiantes?.nombre}</span><span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] font-black">{p.votos} VOTOS</span></div>
                        <p className="text-gray-800 dark:text-gray-100 font-black text-lg leading-tight tracking-tight text-justify">{p.pregunta}</p>
                      </div>
                      {p.estado === 'pendiente' && ( <button onClick={() => updatePreguntaEstado(p.id, 'respondida')} className="shrink-0 flex items-center justify-center gap-2 px-6 py-3 bg-[#22573E] hover:bg-emerald-800 text-white rounded-2xl text-xs font-black shadow-xl shadow-emerald-950/20 active:scale-95"><Check size={16} /> LISTO</button> )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'polls' && (
            <div className="max-w-3xl mx-auto anim-fade-up">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">Encuestas en Vivo</h2>
                  <p className="text-sm text-gray-500">Haz preguntas rápidas a la audiencia</p>
                </div>
                <button onClick={() => setShowPollModal(true)} className="flex items-center gap-2 px-6 py-3 bg-[#22573E] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95"><Plus size={16} /> Crear Encuesta</button>
              </div>
              
              <div className="space-y-6">
                {encuestas.length === 0 ? (
                  <div className="bg-white dark:bg-[#122A1C] rounded-[3rem] p-16 text-center border border-dashed border-gray-200 dark:border-emerald-900/30">
                    <BarChart className="mx-auto text-gray-300 dark:text-emerald-900/40 w-16 h-16 mb-4" />
                    <p className="text-gray-400 font-bold">No has lanzado ninguna encuesta aún.</p>
                  </div>
                ) : (
                  encuestas.map(e => {
                    const totalVotes = e.opciones.reduce((acc, curr) => acc + curr.votos, 0)
                    return (
                      <div key={e.id} className={`bg-white dark:bg-[#122A1C] rounded-[2.5rem] p-8 shadow-xl border border-white dark:border-emerald-900/20 transition-all ${e.estado === 'cerrada' ? 'opacity-70' : 'ring-4 ring-emerald-500/20'}`}>
                        <div className="flex justify-between items-start mb-6">
                          <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{e.pregunta}</h3>
                          {e.estado === 'activa' ? (
                            <button onClick={() => handleClosePoll(e.id)} className="px-4 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-[10px] font-black uppercase tracking-widest">Cerrar</button>
                          ) : (
                            <span className="px-4 py-1.5 bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 rounded-full text-[10px] font-black uppercase tracking-widest">Cerrada</span>
                          )}
                        </div>
                        <div className="space-y-4">
                          {e.opciones.map((opt, i) => {
                            const pct = totalVotes === 0 ? 0 : Math.round((opt.votos / totalVotes) * 100)
                            return (
                              <div key={i} className="relative bg-gray-50 dark:bg-black/20 rounded-2xl p-4 overflow-hidden">
                                <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/30 transition-all duration-1000" style={{ width: `${pct}%` }} />
                                <div className="relative z-10 flex justify-between items-center font-bold">
                                  <span className="text-gray-800 dark:text-gray-200">{opt.texto}</span>
                                  <span className="text-emerald-700 dark:text-emerald-400">{opt.votos} ({pct}%)</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        <p className="text-center text-xs text-gray-400 font-bold mt-4">{totalVotes} votos totales</p>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'networking' && (
            <div className="max-w-4xl mx-auto anim-fade-up">
              <div className="bg-white dark:bg-[#122A1C] rounded-[3rem] p-10 shadow-2xl border border-white dark:border-emerald-900/20">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Talento Interesado</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-justify">Alumnos que desean conectar profesionalmente contigo.</p>
                  </div>
                  <button onClick={downloadCSV} disabled={networkingLeads.length === 0} className="flex items-center gap-2 px-6 py-3 bg-[#22573E] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-50 active:scale-95"><Download size={16} /> Exportar CSV</button>
                </div>
                
                {networkingLeads.length === 0 ? (
                  <div className="py-20 text-center">
                    <Briefcase className="mx-auto text-gray-300 dark:text-emerald-900/30 w-16 h-16 mb-4" />
                    <p className="text-gray-400 font-bold text-sm">Nadie ha compartido su perfil aún.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-emerald-900/40 text-xs font-black text-gray-400 uppercase tracking-widest">
                          <th className="pb-4 pl-4">Estudiante</th>
                          <th className="pb-4">Programa</th>
                          <th className="pb-4">Contacto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-emerald-900/20">
                        {networkingLeads.map((l, i) => (
                          <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-emerald-900/10 transition-colors">
                            <td className="py-4 pl-4 font-bold text-gray-900 dark:text-white text-sm">{l.estudiantes?.nombre} {l.estudiantes?.apellidos}</td>
                            <td className="py-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">{PROGRAMA_LABELS[l.estudiantes?.programa_academico] || l.estudiantes?.programa_academico}</td>
                            <td className="py-4 text-sm text-gray-500 dark:text-gray-300 font-medium">{l.estudiantes?.correo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'scan' && (
            <div className="max-w-lg mx-auto anim-fade-up">
              <div className="bg-white dark:bg-[#122A1C] rounded-[3rem] shadow-2xl border-4 border-white dark:border-emerald-900/30 p-10 text-center">
                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner"><ScanLine size={32} className="text-[#22573E] dark:text-emerald-400" /></div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Registro directo</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-10 px-4 text-justify">Puedes registrar la asistencia de los alumnos escaneando su ticket digital.</p>
                <div className="relative rounded-[2.5rem] overflow-hidden bg-black aspect-square mb-10 border-8 border-gray-50 dark:border-black shadow-2xl">
                  {!scanning ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8"><Sparkles size={48} className="text-emerald-500/20 mb-6" /><button onClick={() => setScanning(true)} className="w-full py-4 bg-[#22573E] text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-950/20">Iniciar Escáner</button></div>
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
        </main>
        <footer className="p-8 text-center text-gray-400 mt-auto relative z-10"><p className="text-[10px] font-black uppercase tracking-[0.3em]">UESSJR • Portal para Ponentes v3.0</p></footer>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-up {
          0% { transform: translateY(100vh) scale(0.5); opacity: 0; }
          20% { transform: translateY(80vh) scale(1.2); opacity: 1; }
          80% { transform: translateY(20vh) scale(1); opacity: 0.8; }
          100% { transform: translateY(0vh) scale(0.5); opacity: 0; }
        }
        .animate-float-up {
          animation: float-up 3s ease-out forwards;
        }
      `}} />

      {/* Modal Crear Encuesta */}
      {showPollModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm anim-fade-in">
          <div className="bg-white dark:bg-[#122A1C] rounded-[2.5rem] p-8 sm:p-12 shadow-2xl border border-gray-100 dark:border-emerald-900/30 w-full max-w-lg relative anim-fade-up">
            <button 
              onClick={() => setShowPollModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors outline-none"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Crear encuesta rápida</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">Lanza una pregunta interactiva a tu audiencia en tiempo real.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Pregunta</label>
                <input 
                  type="text" 
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                  placeholder="Ej. ¿Qué opinan de la IA generativa?"
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-[#0F2018] border border-gray-100 dark:border-emerald-900/50 rounded-2xl outline-none focus:border-[#22573E] text-sm font-bold text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Opciones</label>
                <div className="space-y-3">
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input 
                        type="text" 
                        value={opt}
                        onChange={e => {
                          const newOpts = [...pollOptions]
                          newOpts[i] = e.target.value
                          setPollOptions(newOpts)
                        }}
                        placeholder={`Opción ${i + 1}`}
                        className="flex-1 px-4 py-3 bg-gray-50 dark:bg-[#0F2018] border border-gray-100 dark:border-emerald-900/50 rounded-xl outline-none focus:border-[#22573E] text-sm font-semibold text-gray-900 dark:text-gray-100"
                      />
                      {pollOptions.length > 2 && (
                        <button 
                          onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                          className="px-3 bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400 rounded-xl hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {pollOptions.length < 5 && (
                  <button 
                    onClick={() => setPollOptions([...pollOptions, ''])}
                    className="mt-4 text-xs font-bold text-[#22573E] dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1 hover:opacity-70 transition-opacity"
                  >
                    <Plus size={14} /> Añadir opción
                  </button>
                )}
              </div>

              <button 
                onClick={handleCreatePoll}
                disabled={creandoEncuesta || !pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
                className="w-full py-4 mt-4 bg-[#22573E] text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
              >
                {creandoEncuesta ? 'Lanzando...' : 'Lanzar Encuesta En Vivo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

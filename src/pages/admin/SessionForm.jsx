import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { sesionesService } from '../../services/sesiones.service'
import { escenariosService } from '../../services/escenarios.service'
import { jornadaService } from '../../services/jornada.service'
import { propuestasService } from '../../services/propuestas.service'
import { supabase } from '../../services/supabase'

// ─── Toggle reutilizable ───────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, label, hint }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-emerald-900/30">
      <div>
        <span className="text-gray-700 dark:text-gray-300 font-medium">{label}</span>
        {hint && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ml-4
          ${checked ? 'bg-[#1B4332]' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow
          ${checked ? 'translate-x-7' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}

// ─── Tipos de sesión ────────────────────────────────────────────────────────
const TIPOS = [
  { value: 'inauguracion', label: 'Inauguración' },
  { value: 'conferencia',  label: 'Conferencia'  },
  { value: 'taller',       label: 'Taller'       },
  { value: 'cultural',     label: 'Cultural'     },
  { value: 'protocolo',    label: 'Protocolo'    },
  { value: 'competencia',  label: 'Competencia'  },
  { value: 'cierre',       label: 'Cierre'       },
]

const TIPO_COLORS = {
  conferencia:  'bg-emerald-100 text-emerald-800',
  taller:       'bg-amber-100   text-amber-800',
  cultural:     'bg-purple-100  text-purple-800',
  inauguracion: 'bg-blue-100    text-blue-800',
  cierre:       'bg-rose-100    text-rose-800',
  competencia:  'bg-orange-100  text-orange-800',
  protocolo:    'bg-gray-100    text-gray-800',
}

const PROGRAMAS = [
  { label: 'Ing. Sistemas',            value: 'sistemas'            },
  { label: 'Ing. Innovación Agrícola', value: 'innovacion_agricola' },
  { label: 'Contaduría',               value: 'contaduria'          },
  { label: 'Público general',          value: 'publico_general'     },
]

// ─── Componente principal ──────────────────────────────────────────────────
export default function SessionForm() {
  const navigate  = useNavigate()

  const { id }    = useParams()
  const [searchParams] = useSearchParams()

  const [formData, setFormData] = useState({
    tipo:                          'conferencia',
    nombre:                        '',
    descripcion:                   '',
    hora_inicio:                   '',
    hora_fin:                      '',
    dia_jornada_id:                '',
    escenario_id:                  '',
    jornada_id:                    '',
    programa_academico:            [],
    requiere_materiales:           false,
    materiales_requeridos:         '',
    ponente_nombre:                '',
    ponente_grado:                 '',
    ponente_perfil_publico:        '',
    ponente_cv_privado:            '',
    ponente_foto_url:              '',
    ponente_representa_institucion: false,
    ponente_institucion:           '',
    estado:                        'activa',
  })

  const [escenarios,       setEscenarios]       = useState([])
  const [dias,             setDias]             = useState([])
  const [escenarioSelec,   setEscenarioSelec]   = useState(null)
  const [loading,          setLoading]          = useState(false)
  const [loadingData,      setLoadingData]      = useState(true)
  const [error,            setError]            = useState(null)
  const [success,          setSuccess]          = useState(false)
  const [camposError,      setCamposError]      = useState([])
  const [fotoPreview,      setFotoPreview]      = useState(null)
  const [fotoFile,         setFotoFile]         = useState(null)
  const [logoFile,         setLogoFile]         = useState(null)
  const [logoPreview,      setLogoPreview]      = useState(null)
  
  const [horariosOcupados, setHorariosOcupados] = useState([])
  const [loadingHorarios,  setLoadingHorarios]  = useState(false)
  const [colision,         setColision]         = useState(null)

  const errorRef = useRef(null)

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [error])

  useEffect(() => {
    async function loadHorarios() {
      if (formData.escenario_id && formData.dia_jornada_id) {
        setLoadingHorarios(true)
        try {
          const { data } = await supabase
            .from('sesiones')
            .select('id, hora_inicio, hora_fin, nombre, estado')
            .eq('escenario_id', formData.escenario_id)
            .eq('dia_jornada_id', formData.dia_jornada_id)
            .neq('estado', 'cancelada')
          const ocupados = (data || []).filter(s => s.id !== id)
          setHorariosOcupados(ocupados.sort((a,b) => a.hora_inicio.localeCompare(b.hora_inicio)))
          
          // Check colisión en tiempo real
          if (formData.hora_inicio && formData.hora_fin) {
            const hi = formData.hora_inicio
            const hf = formData.hora_fin
            const c = ocupados.find(s => hi < s.hora_fin && hf > s.hora_inicio)
            setColision(c || null)
          } else {
            setColision(null)
          }
        } catch(e) {
          console.error(e)
        } finally {
          setLoadingHorarios(false)
        }
      } else {
        setHorariosOcupados([])
        setColision(null)
      }
    }
    loadHorarios()
  }, [formData.escenario_id, formData.dia_jornada_id, formData.hora_inicio, formData.hora_fin, id])

  // ── Carga inicial ──────────────────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingData(true)
        const [jornada, escList] = await Promise.all([
          jornadaService.getActiva(),
          escenariosService.getAll(),
        ])

        const diasOrdenados = (jornada.dias_jornada || []).sort(
          (a, b) => new Date(a.fecha) - new Date(b.fecha)
        )
        setDias(diasOrdenados)
        setEscenarios(escList || [])
        setFormData(prev => ({ ...prev, jornada_id: jornada.id }))

        if (id) {
          const sesion = await sesionesService.getById(id)
          setFormData(prev => ({ ...prev, ...sesion }))
          if (sesion.ponente_foto_url) setFotoPreview(sesion.ponente_foto_url)
          const esc = escList.find(e => e.id === sesion.escenario_id)
          if (esc) setEscenarioSelec(esc)
        } else {
          // Precargar datos de propuesta si viene de ProposalsManagement
          const propuestaId = searchParams.get('propuesta')
          if (propuestaId) {
            try {
              const prop = await propuestasService.getById(propuestaId)
              if (prop) {
                setFormData(prev => ({
                  ...prev,
                  tipo:                    prop.tipo_actividad || prev.tipo,
                  nombre:                  prop.titulo || '',
                  descripcion:             prop.descripcion || '',
                  programa_academico:      prop.dirigido_a || [],
                  requiere_materiales:     prop.requiere_materiales || false,
                  materiales_requeridos:   prop.materiales_descripcion || '',
                  ponente_nombre:          prop.nombre_completo || '',
                  ponente_representa_institucion: prop.representa_institucion || false,
                  ponente_institucion:     prop.nombre_institucion || '',
                }))
              }
            } catch (err) {
              console.warn('No se pudo cargar la propuesta:', err)
            }
          }
        }
      } catch (err) {
        setError('Error cargando datos: ' + err.message)
      } finally {
        setLoadingData(false)
      }
    }
    loadData()
  }, [id])

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleChange = (e) => {
    if (error) setError(null)
    if (camposError.length > 0)
      setCamposError(prev => prev.filter(c => c !== e.target.name))

    const { name, value } = e.target

    // Al cambiar escenario, guardamos el objeto completo para mostrar info
    if (name === 'escenario_id') {
      const esc = escenarios.find(e => e.id === value)
      setEscenarioSelec(esc || null)
    }

    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleProgramaToggle = (programa) => {
    setFormData(prev => {
      const arr = prev.programa_academico || []
      return {
        ...prev,
        programa_academico: arr.includes(programa)
          ? arr.filter(p => p !== programa)
          : [...arr, programa],
      }
    })
  }

  const handleFotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFotoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setFotoPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setLogoPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e, isDraft = false) => {
    if (e) e.preventDefault()

    const requeridos = {
      nombre:                 'Nombre de la sesión',
      hora_inicio:            'Hora de inicio',
      hora_fin:               'Hora de fin',
      dia_jornada_id:         'Día',
      escenario_id:           'Escenario',
      ponente_nombre:         'Nombre del ponente',
      ponente_perfil_publico: 'Perfil público del ponente',
    }

    const faltantes = Object.entries(requeridos)
      .filter(([key]) => !formData[key])
      .map(([, label]) => label)

    if (faltantes.length > 0) {
      setCamposError(Object.keys(requeridos).filter(key => !formData[key]))
      setError(`Completa los campos requeridos: ${faltantes.join(', ')}`)
      return
    }
    setCamposError([])

    try {
      setLoading(true)
      setError(null)

      // Validar solapamiento de horarios en el mismo escenario
      if (formData.escenario_id && formData.dia_jornada_id && formData.hora_inicio && formData.hora_fin) {
        const solapados = await sesionesService.checkSolapamiento(
          formData.escenario_id,
          formData.dia_jornada_id,
          formData.hora_inicio,
          formData.hora_fin,
          id || null
        )
        if (solapados.length > 0) {
          const s = solapados[0]
          setError(`Conflicto de horario: el escenario ya tiene "${s.nombre}" de ${s.hora_inicio?.slice(0,5)} a ${s.hora_fin?.slice(0,5)} en ese mismo día. Ajusta el horario o elige otro escenario.`)
          setCamposError(['hora_inicio', 'hora_fin', 'escenario_id'])
          return
        }
      }

      // Construir payload — cupo viene del escenario si no se especifica
      const payload = {
        ...formData,
        cupo_maximo: escenarioSelec?.capacidad_maxima ?? null,
        estado: isDraft ? 'borrador' : formData.estado,
      }

      // Subir foto si hay archivo nuevo
      if (fotoFile) {
        const ext  = fotoFile.name.split('.').pop()
        const path = `fotos/${Date.now()}.${ext}`
        const { data: up, error: upErr } = await supabase
          .storage.from('ponentes').upload(path, fotoFile)
        if (!upErr) {
          const { data: urlData } = supabase
            .storage.from('ponentes').getPublicUrl(up.path)
          payload.ponente_foto_url = urlData.publicUrl
        }
      }

      // Subir logo de la institución y guardarlo globalmente
      if (logoFile && formData.ponente_representa_institucion) {
        const ext  = logoFile.name.split('.').pop()
        const path = `instituciones/${Date.now()}.${ext}`
        const { data: up, error: upErr } = await supabase
          .storage.from('logos').upload(path, logoFile)
        if (!upErr) {
          const { data: urlData } = supabase
            .storage.from('logos').getPublicUrl(up.path)
          // Insertar en la tabla instituciones para reportes
          await supabase.from('instituciones').insert([{
            nombre: formData.ponente_institucion || 'Institución',
            logotipo_url: urlData.publicUrl,
            orden: 99
          }])
        }
      }

      if (id) {
        await sesionesService.update(id, payload)
      } else {
        await sesionesService.create(payload)
      }

      setSuccess(true)
      setTimeout(() => navigate('/admin/sesiones'), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Helper clase de campo con error ───────────────────────────────────
  const fc = (name, extra = '') =>
    `w-full px-0 py-2 border-0 border-b border-gray-300 dark:border-emerald-900/40 bg-transparent outline-none transition-colors rounded-none text-gray-900 dark:text-gray-200
     ${camposError.includes(name)
       ? 'border-red-400 focus:border-red-500 focus:ring-0'
       : 'focus:border-[#F9A825] focus:ring-0'
     } ${extra}`

  // ── Formato fecha para el select ──────────────────────────────────────
  const formatDia = (dia) => {
    const d = new Date(dia.fecha + 'T12:00:00')
    return `${dia.nombre_dia} ${d.toLocaleDateString('es-MX', {
      day: 'numeric', month: 'long'
    })}`
  }

  // ── Opciones de hora (8 AM a 6 PM, cada 10 min) ─────────────────────────
  const timeOptions = []
  for (let h = 8; h <= 18; h++) {
    const hh = h.toString().padStart(2, '0')
    for (let m = 0; m < 60; m += 10) {
      if (h === 18 && m > 0) break // Limitar a las 18:00
      const mm = m.toString().padStart(2, '0')
      timeOptions.push(`${hh}:${mm}`)
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────
  if (loadingData) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#F8FAF9] dark:bg-[#0A1A11] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#1B4332] animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Cargando datos de la jornada...</p>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>

        {/* Topbar sticky */}
        <div className="bg-white dark:bg-[#122A1C] border-b border-gray-100 dark:border-emerald-900/40 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-14 lg:top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/sesiones')}
              className="text-gray-400 dark:text-gray-500 hover:text-[#1B4332] dark:hover:text-emerald-400 transition-colors p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl"
              title="Volver a sesiones"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/admin/dashboard')}
                  className="hover:text-[#1B4332] dark:hover:text-emerald-400 transition-colors font-medium"
                >
                  Panel de control
                </button>
                <span>/</span>
                <button
                  type="button"
                  onClick={() => navigate('/admin/sesiones')}
                  className="hover:text-[#1B4332] dark:hover:text-emerald-400 transition-colors font-medium"
                >
                  Sesiones
                </button>
                <span>/</span>
              </div>
              <span className="text-gray-700 dark:text-gray-200 font-extrabold">
                {id ? 'Editar sesión' : 'Nueva sesión'}
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

          {/* Alertas */}
          {error && (
            <div ref={errorRef} className="mb-6 p-4 bg-red-50 border-l-4 border-red-500
                            text-red-700 rounded-lg text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500
                            text-emerald-700 rounded-lg font-semibold text-sm">
              ¡Sesión registrada exitosamente! Redirigiendo...
            </div>
          )}

          {/* Aviso si no hay días cargados */}
          {dias.length === 0 && !loadingData && (
            <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-400
                            text-amber-700 rounded-lg text-sm">
              ⚠️ No se encontraron días registrados para la jornada activa.
              Ve a <button onClick={() => navigate('/admin/jornada')}
                className="underline font-semibold">Gestión de jornada</button> y
              agrega los días antes de registrar sesiones.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── FORMULARIO ── */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <form id="session-form" onSubmit={(e) => handleSubmit(e, false)}>

                {/* SECCIÓN 1 — Información de la sesión */}
                <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-sm p-8 mb-6">
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-gray-100 border-b
                                 border-gray-100 dark:border-emerald-900/30 pb-4 mb-6">
                    Información de la sesión
                  </h3>

                  <div className="space-y-6">

                    {/* Tipo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Tipo de sesión *
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {TIPOS.map(({ value, label }) => (
                          <button
                            type="button"
                            key={value}
                            onClick={() => setFormData(prev => ({ ...prev, tipo: value }))}
                            className={`px-4 py-2 rounded-full text-sm font-semibold
                              transition-all border
                              ${formData.tipo === value
                                ? 'bg-[#1B4332] text-white border-[#1B4332]'
                                : 'bg-white dark:bg-[#0F2018] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-emerald-900/40 hover:border-[#1B4332] dark:hover:border-emerald-700 hover:text-[#1B4332] dark:hover:text-emerald-400'}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Nombre */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nombre de la sesión *
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        placeholder="Ej. Inteligencia artificial aplicada a la industria"
                        className={fc('nombre')}
                      />
                    </div>

                    {/* Día + Escenario */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Día *
                        </label>
                        <select
                          name="dia_jornada_id"
                          value={formData.dia_jornada_id}
                          onChange={handleChange}
                          className={fc('dia_jornada_id')}
                        >
                          <option value="">
                            {dias.length === 0
                              ? '— Sin días registrados —'
                              : 'Seleccionar día'}
                          </option>
                          {dias.map(dia => (
                            <option key={dia.id} value={dia.id}>
                              {formatDia(dia)}
                            </option>
                          ))}
                        </select>
                        {dias.length === 0 && (
                          <p className="text-amber-600 text-xs mt-1">
                            Primero registra los días de la jornada
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Escenario *
                        </label>
                        <select
                          name="escenario_id"
                          value={formData.escenario_id}
                          onChange={handleChange}
                          className={fc('escenario_id')}
                        >
                          <option value="">Seleccionar escenario</option>
                          {escenarios.map(e => (
                            <option key={e.id} value={e.id}>
                              {e.nombre}
                            </option>
                          ))}
                        </select>
                        {escenarioSelec && (
                          <p className="mt-1.5 text-emerald-700 dark:text-emerald-500 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 size={12} /> Capacidad: {escenarioSelec.capacidad_maxima} personas
                          </p>
                        )}
                      </div>

                      {/* Panel de disponibilidad ancho */}
                      {(loadingHorarios || colision || horariosOcupados.length > 0) && (
                        <div className="md:col-span-2 space-y-2 anim-fade-up">
                          {loadingHorarios ? (
                            <div className="bg-gray-50 dark:bg-[#0F2018] p-4 rounded-2xl border border-gray-100 dark:border-emerald-900/20 flex items-center gap-3">
                              <Loader2 className="w-4 h-4 animate-spin text-[#1B4332]" />
                              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Verificando disponibilidad...</p>
                            </div>
                          ) : colision ? (
                            <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-2xl border border-red-100 dark:border-red-900/40 animate-shake">
                              <p className="text-red-700 dark:text-red-400 text-xs font-black flex items-center gap-2 uppercase tracking-wider">
                                <AlertTriangle size={16} /> ¡CONFLICTO DE HORARIO DETECTADO!
                              </p>
                              <p className="text-red-600 dark:text-red-500 text-sm mt-1.5 font-bold leading-tight">
                                El escenario ya está ocupado por <span className="underline decoration-2 text-red-800 dark:text-red-300">"{colision.nombre}"</span> de {colision.hora_inicio.slice(0,5)} a {colision.hora_fin.slice(0,5)}.
                              </p>
                            </div>
                          ) : horariosOcupados.length > 0 ? (
                            <div className="bg-amber-50 dark:bg-amber-950/30 p-5 rounded-3xl border border-amber-100 dark:border-amber-900/40">
                              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-200/50 dark:border-amber-900/30">
                                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                <p className="text-amber-800 dark:text-amber-400 text-[10px] font-black uppercase tracking-[0.15em]">Horarios ya ocupados en este escenario:</p>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                                {horariosOcupados.map((h, i) => (
                                  <div key={i} className="flex items-center gap-3 text-amber-700 dark:text-amber-500">
                                    <span className="text-[10px] font-black font-mono bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-lg border border-amber-200/50 dark:border-amber-900/30">
                                      {h.hora_inicio?.slice(0,5)} - {h.hora_fin?.slice(0,5)}
                                    </span>
                                    <span className="text-xs font-bold truncate">{h.nombre}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {/* Horas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Hora de inicio *
                        </label>
                        <div className="relative">
                          <input
                            list="time-options"
                            name="hora_inicio"
                            value={formData.hora_inicio?.slice(0, 5)}
                            onChange={(e) => {
                              const v = e.target.value
                              if (v.length === 5) setFormData(p => ({ ...p, hora_inicio: `${v}:00` }))
                              else setFormData(p => ({ ...p, hora_inicio: v }))
                            }}
                            placeholder="08:00"
                            className={fc('hora_inicio')}
                          />
                          <datalist id="time-options">
                            {timeOptions.map(t => <option key={t} value={t} />)}
                          </datalist>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Hora de fin *
                        </label>
                        <div className="relative">
                          <input
                            list="time-options"
                            name="hora_fin"
                            value={formData.hora_fin?.slice(0, 5)}
                            onChange={(e) => {
                              const v = e.target.value
                              if (v.length === 5) setFormData(p => ({ ...p, hora_fin: `${v}:00` }))
                              else setFormData(p => ({ ...p, hora_fin: v }))
                            }}
                            placeholder="09:00"
                            className={fc('hora_fin')}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Programa académico */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Programa académico objetivo
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {PROGRAMAS.map(({ label, value }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => handleProgramaToggle(value)}
                            className={`px-4 py-2 rounded-full text-sm font-medium
                              transition-colors border
                              ${(formData.programa_academico || []).includes(value)
                                ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                                : 'bg-white dark:bg-[#0F2018] text-gray-600 dark:text-gray-300 border-gray-300 dark:border-emerald-900/40 hover:border-emerald-400 dark:hover:border-emerald-700'}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Selecciona uno o más. Deja vacío para sesiones de público general.
                      </p>
                    </div>

                    {/* Descripción */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Descripción
                        <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">(opcional)</span>
                      </label>
                      <textarea
                        name="descripcion"
                        rows="4"
                        value={formData.descripcion}
                        onChange={handleChange}
                        placeholder="Describe de qué trata la sesión. Será visible al público."
                        className="w-full px-0 py-2 border-0 border-b border-gray-300 dark:border-emerald-900/40 bg-transparent dark:text-gray-200
                                   focus:border-[#F9A825] focus:ring-0 outline-none resize-none transition-colors rounded-none"
                      />
                    </div>

                    {/* Toggle materiales */}
                    <div>
                      <ToggleSwitch
                        label="Requiere materiales"
                        hint="Activa si los participantes deben traer algo"
                        checked={formData.requiere_materiales}
                        onChange={val => setFormData(p => ({ ...p, requiere_materiales: val }))}
                      />
                      {formData.requiere_materiales && (
                        <textarea
                          name="materiales_requeridos"
                          rows="2"
                          value={formData.materiales_requeridos}
                          onChange={handleChange}
                          placeholder="Ej. Laptop, cuenta de GitHub, cuaderno..."
                          className="mt-3 w-full px-0 py-2 border-0 border-b border-gray-300 dark:border-emerald-900/40 bg-transparent dark:text-gray-200
                                     focus:border-[#F9A825] focus:ring-0 outline-none resize-none rounded-none"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 2 — Datos del ponente */}
                <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-sm p-8 mb-6">
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-gray-100 border-b
                                 border-gray-100 dark:border-emerald-900/30 pb-4 mb-6">
                    Datos del ponente
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 -mt-3 mb-6">
                    Toda sesión debe tener un responsable o ponente.
                  </p>

                  <div className="space-y-6">

                    {/* Nombre + Grado */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Nombre completo *
                        </label>
                        <input
                          type="text"
                          name="ponente_nombre"
                          value={formData.ponente_nombre}
                          onChange={handleChange}
                          placeholder="Ej. María Elena García Torres"
                          className={fc('ponente_nombre')}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Grado académico
                        </label>
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <select
                              name="ponente_grado_select"
                              value={['Lic.','Ing.','Mtra.','Mtro.','Dra.','Dr.','C.P.'].includes(formData.ponente_grado) ? formData.ponente_grado : (formData.ponente_grado ? 'Otro' : '')}
                              onChange={(e) => {
                                const v = e.target.value
                                if (v === 'Otro') setFormData(p => ({...p, ponente_grado: ''}))
                                else if (v === '') setFormData(p => ({...p, ponente_grado: ''}))
                                else setFormData(p => ({...p, ponente_grado: v}))
                              }}
                              className="w-full px-0 py-2 border-0 border-b border-gray-300 dark:border-emerald-900/40 bg-transparent dark:text-gray-200 focus:border-[#F9A825] focus:ring-0 outline-none rounded-none text-sm"
                            >
                              <option value="">Ninguno</option>
                              {['Lic.','Ing.','Mtra.','Mtro.','Dra.','Dr.','C.P.'].map(g => (
                                <option key={g} value={g}>{g}</option>
                              ))}
                              <option value="Otro">Otro...</option>
                            </select>
                          </div>
                          {(!['Lic.','Ing.','Mtra.','Mtro.','Dra.','Dr.','C.P.'].includes(formData.ponente_grado) && formData.ponente_grado !== '') || 
                           (formData.ponente_grado === '' && document.getElementsByName('ponente_grado_select')[0]?.value === 'Otro') ? (
                            <div className="flex-1">
                              <input
                                type="text"
                                value={formData.ponente_grado}
                                onChange={(e) => setFormData(p => ({...p, ponente_grado: e.target.value}))}
                                placeholder="Escribe el grado..."
                                className="w-full px-0 py-2 border-0 border-b border-[#F9A825] bg-transparent dark:text-gray-200 focus:ring-0 outline-none rounded-none text-sm animate-slide-in-right"
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Perfil público */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Perfil público *
                      </label>
                      <textarea
                        name="ponente_perfil_publico"
                        rows="3"
                        value={formData.ponente_perfil_publico}
                        onChange={handleChange}
                        placeholder="Breve descripción profesional visible para los asistentes"
                        className={fc('ponente_perfil_publico', 'resize-none')}
                      />
                      <p className="text-emerald-600 text-xs mt-1 font-medium">
                        ✓ Visible para todos los asistentes
                      </p>
                    </div>

                    {/* CV privado */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">CV Privado del ponente</span>
                        <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-2 py-0.5 rounded-md font-medium">Solo visible para administradores</span>
                      </div>
                      <textarea
                        name="ponente_cv_privado"
                        rows="4"
                        value={formData.ponente_cv_privado}
                        onChange={handleChange}
                        placeholder="Trayectoria completa, publicaciones, logros relevantes..."
                        className="w-full px-0 py-2 border-0 border-b border-gray-300 dark:border-emerald-900/40 bg-transparent dark:text-gray-200
                                   focus:border-[#F9A825] focus:ring-0 outline-none resize-none rounded-none"
                      />
                    </div>

                    {/* Foto */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fotografía del ponente
                        <span className="text-gray-400 font-normal ml-1">(opcional)</span>
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-[#0F2018]
                                        border-2 border-dashed border-gray-300 dark:border-emerald-900/40 shrink-0
                                        flex items-center justify-center">
                          {fotoPreview ? (
                            <img src={fotoPreview} alt="Preview"
                                 className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gray-400 text-xs text-center px-1">Sin foto</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFotoChange}
                            className="block w-full text-sm text-gray-500
                              file:mr-3 file:py-2 file:px-4 file:rounded-lg
                              file:border-0 file:text-sm file:font-semibold
                              file:bg-[#1B4332] file:text-white
                              hover:file:bg-[#2D6A4F] file:cursor-pointer"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            JPG, PNG · Máx. 2 MB. La foto aparecerá en la agenda pública.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Institución */}
                    <div>
                      <ToggleSwitch
                        label="¿Representa una institución?"
                        hint="Universidad, empresa u organización de procedencia"
                        checked={formData.ponente_representa_institucion}
                        onChange={val =>
                          setFormData(p => ({ ...p, ponente_representa_institucion: val }))}
                      />
                      {formData.ponente_representa_institucion && (
                        <div className="mt-4 space-y-4 p-4 bg-gray-50 dark:bg-[#0F2018] rounded-xl border border-gray-100 dark:border-emerald-900/30">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre de la institución</label>
                            <input
                              type="text"
                              name="ponente_institucion"
                              value={formData.ponente_institucion}
                              onChange={handleChange}
                              placeholder="Ej. Universidad Autónoma del Estado de México"
                              className="w-full px-0 py-2 border-0 border-b border-gray-300 dark:border-emerald-900/40 bg-transparent dark:text-gray-200
                                         focus:border-[#F9A825] focus:ring-0 outline-none rounded-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo de la institución</label>
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-[#0F2018]
                                              border-2 border-dashed border-gray-300 dark:border-emerald-900/40 shrink-0
                                              flex items-center justify-center p-1">
                                {logoPreview ? (
                                  <img src={logoPreview} alt="Preview"
                                       className="w-full h-full object-contain" />
                                ) : (
                                  <span className="text-gray-400 text-[10px] text-center px-1 uppercase tracking-widest font-bold">Sin logo</span>
                                )}
                              </div>
                              <div className="flex-1">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleLogoChange}
                                  className="block w-full text-sm text-gray-500
                                    file:mr-3 file:py-2 file:px-4 file:rounded-lg
                                    file:border-0 file:text-sm file:font-semibold
                                    file:bg-amber-100 file:text-amber-800
                                    hover:file:bg-amber-200 file:cursor-pointer"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                  Se añadirá a la base de logos institucionales y se usará en los reportes PDF.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </form>

              {/* ACTION BUTTONS MOVED TO BOTTOM */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-8 border-t border-gray-200 dark:border-emerald-900/30">
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={loading || success}
                  className="px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-[#0F2018]
                             border border-gray-200 dark:border-emerald-900/40 rounded-xl hover:bg-gray-50 dark:hover:bg-emerald-900/20 hover:border-gray-300 dark:hover:border-emerald-700
                             transition-all shadow-sm disabled:opacity-50"
                >
                  Guardar borrador
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, false)}
                  disabled={loading || success}
                  style={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)' }}
                  className="px-8 py-3 text-sm font-semibold text-white
                             rounded-xl hover:-translate-y-0.5 hover:shadow-md transition-all shadow-lg
                             disabled:opacity-50 disabled:hover:translate-y-0 min-w-[180px] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</>
                  ) : success ? (
                    <><CheckCircle2 className="w-5 h-5" /> ¡Sesión guardada!</>
                  ) : (
                    <><Save className="w-5 h-5" /> Registrar sesión</>
                  )}
                </button>
              </div>

            </div>

            {/* ── VISTA PREVIA ── */}
            <div className="lg:col-span-1 order-1 lg:order-2">
              <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-sm p-6 lg:sticky lg:top-24">
                <p className="font-extrabold text-gray-900 dark:text-gray-100 text-sm mb-0.5">Vista previa</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mb-5">
                  Así verán los asistentes esta sesión
                </p>

                <div className="border border-gray-200 dark:border-emerald-900/40 rounded-xl overflow-hidden">
                  <div className="border-l-4 border-[#1B4332] p-4 space-y-3">

                    {/* Badge + hora */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase
                        ${TIPO_COLORS[formData.tipo] || 'bg-gray-100 text-gray-700'}`}>
                        {TIPOS.find(t => t.value === formData.tipo)?.label || 'Tipo'}
                      </span>
                      {formData.hora_inicio && (
                        <span className="text-[#1B4332] font-bold text-xs">
                          {formData.hora_inicio}
                          {formData.hora_fin && ` — ${formData.hora_fin}`} hrs
                        </span>
                      )}
                    </div>

                    {/* Título */}
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-snug">
                      {formData.nombre || (
                        <span className="text-gray-400 italic">Nombre de la sesión...</span>
                      )}
                    </h4>

                    {/* Ponente */}
                    {formData.ponente_nombre && (
                      <div className="flex items-center gap-2">
                        {fotoPreview ? (
                          <img src={fotoPreview} alt="ponente"
                               className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#1B4332]
                                          flex items-center justify-center shrink-0">
                            <span className="text-white text-xs font-bold">
                              {formData.ponente_nombre.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                            {formData.ponente_grado} {formData.ponente_nombre}
                          </p>
                          {formData.ponente_institucion && (
                            <p className="text-xs text-gray-500 leading-tight">
                              {formData.ponente_institucion}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Perfil */}
                    {formData.ponente_perfil_publico && (
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {formData.ponente_perfil_publico}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="border-t border-gray-100 dark:border-emerald-900/30 pt-3
                                    grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div>
                        <p className="text-gray-400 uppercase text-[10px] font-medium mb-0.5">
                          Día
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">
                          {dias.find(d => d.id === formData.dia_jornada_id)?.nombre_dia || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 uppercase text-[10px] font-medium mb-0.5">
                          Escenario
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">
                          {escenarioSelec?.nombre || '—'}
                        </p>
                      </div>
                      {escenarioSelec && (
                        <div className="col-span-2">
                          <p className="text-gray-400 uppercase text-[10px] font-medium mb-0.5">
                            Cupo
                          </p>
                          <p className="text-gray-700 dark:text-gray-300 font-medium">
                            {escenarioSelec.capacidad_maxima} lugares disponibles
                          </p>
                        </div>
                      )}
                      {(formData.programa_academico || []).length > 0 && (
                        <div className="col-span-2">
                          <p className="text-gray-400 uppercase text-[10px] font-medium mb-1">
                            Dirigido a
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {formData.programa_academico.map(p => (
                              <span key={p}
                                    className="bg-gray-100 dark:bg-emerald-900/30 text-gray-600 dark:text-emerald-400
                                               px-2 py-0.5 rounded-full text-[10px]">
                                {PROGRAMAS.find(pr => pr.value === p)?.label || p}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {formData.requiere_materiales && (
                        <div className="col-span-2">
                          <p className="text-amber-600 text-[10px] font-medium">
                            📋 Requiere materiales
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 text-center mt-3">
                  Se actualiza en tiempo real
                </p>

                {/* Indicador de completitud */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-emerald-900/30">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Campos completados
                  </p>
                  {[
                    { label: 'Tipo de sesión',  done: !!formData.tipo },
                    { label: 'Nombre',          done: !!formData.nombre },
                    { label: 'Día',             done: !!formData.dia_jornada_id },
                    { label: 'Escenario',       done: !!formData.escenario_id },
                    { label: 'Horario',         done: !!(formData.hora_inicio && formData.hora_fin) },
                    { label: 'Ponente',         done: !!formData.ponente_nombre },
                    { label: 'Perfil público',  done: !!formData.ponente_perfil_publico },
                  ].map(({ label, done }) => (
                    <div key={label}
                         className="flex items-center gap-2 text-xs py-0.5">
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center
                        justify-center text-[9px] font-bold shrink-0
                        ${done ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-emerald-900/40 text-gray-400 dark:text-gray-500'}`}>
                        {done ? '✓' : ''}
                      </span>
                      <span className={done ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
    </>
  )
}
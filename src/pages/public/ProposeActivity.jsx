import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, ChevronRight } from 'lucide-react'
import { jornadaService }    from '../../services/jornada.service'
import { propuestasService } from '../../services/propuestas.service'

// ─── Constantes ───────────────────────────────────────────────────────────────
const TIPOS = [
  { value: 'conferencia', label: 'Conferencia', emoji: '🎓',
    desc: 'Exposición de un tema ante la audiencia' },
  { value: 'taller',      label: 'Taller',      emoji: '🛠️',
    desc: 'Actividad práctica y participativa'     },
  { value: 'cultural',    label: 'Cultural',    emoji: '🎨',
    desc: 'Arte, música o expresión creativa'     },
  { value: 'competencia', label: 'Competencia', emoji: '🏆',
    desc: 'Concurso o reto entre participantes'   },
]

const PROGRAMAS = [
  { value: 'sistemas',            label: 'Ing. sistemas',           color: '#D97706' },
  { value: 'innovacion_agricola', label: 'Ing. innovación agrícola', color: '#16A34A' },
  { value: 'contaduria',          label: 'Contaduría',               color: '#2563EB' },
  { value: 'publico_general',     label: 'Público en general',       color: '#7C3AED' },
]

const RELACIONES = [
  { value: 'estudiante', label: 'Estudiante UES SJR' },
  { value: 'egresado',   label: 'Egresado'            },
  { value: 'docente',    label: 'Docente'              },
  { value: 'externo',    label: 'Externo'              },
  { value: 'empresa',    label: 'Empresa'              },
]

// ─── Toggle component ─────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label, hint }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</p>
        {hint && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-all shrink-0
                    border-2 focus:outline-none
                    ${checked
                      ? 'bg-[#1B4332] border-[#1B4332]'
                      : 'bg-gray-100 dark:bg-[#0F2018] border-gray-200 dark:border-emerald-900/50 hover:border-gray-300 dark:hover:border-emerald-800'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full
                          transition-transform shadow-sm
                          ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

// ─── Field component ──────────────────────────────────────────────────────────
function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
        {label}
        {required && <span className="text-[#D97706] ml-1">*</span>}
        {hint && <span className="text-gray-400 dark:text-gray-500 font-normal ml-1.5 text-xs">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

const INPUT_CLASS = `w-full px-4 py-3 bg-white dark:bg-[#0F2018] border border-gray-200 dark:border-emerald-900/50 rounded-xl
                     focus:border-[#1B4332] focus:ring-4 focus:ring-[#1B4332]/8
                     outline-none transition-all text-sm text-gray-900 dark:text-gray-300
                     placeholder:text-gray-300 dark:placeholder:text-gray-600`

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ step, current }) {
  const done   = current > step
  const active = current === step
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs
                     font-black transition-all shrink-0
                     ${done   ? 'bg-[#1B4332] text-white'
                     : active ? 'bg-[#D97706] text-white ring-4 ring-[#D97706]/20'
                              : 'bg-gray-100 dark:bg-emerald-950 text-gray-400 dark:text-gray-600'}`}>
      {done ? <Check size={13} strokeWidth={3} /> : step}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProposeActivity() {
  const [jornada,  setJornada]  = useState(null)
  const [dias,     setDias]     = useState([])
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [error,    setError]    = useState(null)
  const [step,     setStep]     = useState(1) // 1 | 2 | 3

  useEffect(() => {
    if (error) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [error])

  const [form, setForm] = useState({
    nombre_completo:        '',
    correo:                 '',
    telefono:               '',
    relacion_institucion:   'estudiante',
    tipo_actividad:         '',
    titulo:                 '',
    descripcion:            '',
    duracion_estimada:      '1 hora',
    dirigido_a:             [],
    requiere_materiales:    false,
    materiales_descripcion: '',
    representa_institucion: false,
    nombre_institucion:     '',
    dias_disponibles:       [],
    horario_preferido:      'mañana',
    jornada_id:             null,
  })

  useEffect(() => {
    async function cargar() {
      try {
        const j = await jornadaService.getActiva()
        setJornada(j)
        const diasOrdenados = (j.dias_jornada || [])
          .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        setDias(diasOrdenados)
        setForm(prev => ({ ...prev, jornada_id: j.id }))
      } catch (err) {
        console.error(err)
      }
    }
    cargar()
  }, [])

  const handleChange = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (error) setError(null)
  }

  const toggleArray = (field, value) => {
    setForm(prev => {
      const arr = prev[field] || []
      return {
        ...prev,
        [field]: arr.includes(value)
          ? arr.filter(v => v !== value)
          : [...arr, value],
      }
    })
  }

  // Validación por paso
  const validateStep = (s) => {
    if (s === 1) {
      if (!form.nombre_completo) return 'Ingresa tu nombre completo.'
      if (!form.correo)          return 'Ingresa tu correo electrónico.'
      if (!/\S+@\S+\.\S+/.test(form.correo)) return 'El correo no es válido.'
    }
    if (s === 2) {
      if (!form.tipo_actividad) return 'Selecciona el tipo de actividad.'
      if (!form.titulo)         return 'Escribe el título de tu propuesta.'
      if (!form.descripcion)    return 'Describe tu propuesta.'
    }
    return null
  }

  const handleNext = () => {
    const err = validateStep(step)
    if (err) { setError(err); return }
    setError(null)
    setStep(s => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    setError(null)
    setStep(s => s - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (dias.length > 0 && form.dias_disponibles.length === 0) {
      setError('Selecciona al menos un día de disponibilidad.')
      return
    }
    try {
      setLoading(true)
      setError(null)
      await propuestasService.create(form)
      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Estado de éxito ────────────────────────────────────────────────────────
  if (success) return (
    <div className="min-h-screen bg-[#F0F7F4] dark:bg-[#0A1A11] flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full text-center">

        {/* Círculos de confeti */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
          <div className="absolute inset-2 rounded-full bg-emerald-200 animate-ping opacity-20"
               style={{ animationDelay: '0.2s' }} />
          <div className="relative w-32 h-32 rounded-full bg-[#1B4332] flex items-center justify-center shadow-xl shadow-emerald-900/20">
            <span className="text-5xl">✨</span>
          </div>
        </div>

        <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-3 tracking-tight">
          ¡Propuesta enviada!
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-2 text-base leading-relaxed">
          Recibimos tu propuesta correctamente.
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mb-8 leading-relaxed">
          Nuestro equipo la revisará y se pondrá en contacto contigo en 3 a 5 días hábiles al correo{' '}
          <strong className="text-gray-600 dark:text-gray-300">{form.correo}</strong>.
        </p>

        <div className="bg-white dark:bg-[#122A1C] rounded-2xl border border-gray-100 dark:border-emerald-900/40 p-5 mb-6 text-left shadow-sm">
          <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
            Resumen de tu propuesta
          </p>
          <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{form.titulo}</p>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 capitalize">
            {TIPOS.find(t => t.value === form.tipo_actividad)?.emoji}{' '}
            {TIPOS.find(t => t.value === form.tipo_actividad)?.label}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => { setSuccess(false); setStep(1); setForm(prev => ({ ...prev, titulo: '', descripcion: '', tipo_actividad: '' })) }}
            className="w-full py-3 bg-[#1B4332] text-white font-bold rounded-xl
                       hover:bg-emerald-800 transition-colors"
          >
            Enviar otra propuesta
          </button>
          <Link
            to="/agenda"
            className="w-full py-3 border border-gray-200 dark:border-emerald-900/40 text-gray-600 dark:text-gray-400 font-semibold
                       rounded-xl hover:bg-gray-50 dark:hover:bg-[#122A1C] transition-colors text-center text-sm"
          >
            Ver la agenda de la jornada
          </Link>
        </div>
      </div>
    </div>
  )

  // ── Header con imagen de fondo oscuro ────────────────────────────────────
  const STEP_LABELS = ['Tus datos', 'Tu propuesta', 'Disponibilidad']

  return (
    <div className="min-h-screen bg-[#F8FAFB] dark:bg-[#0A1A11]">

      {/* Header institucional */}
      <div className="relative bg-[#1B4332] pt-28 pb-16 px-4 overflow-hidden">

        {/* Patrón de fondo */}
        <div className="absolute inset-0 opacity-5 pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#F8FAFB] dark:from-[#0A1A11] to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20
                          text-white/80 text-xs font-bold px-4 py-1.5 rounded-full
                          uppercase tracking-widest mb-5">
            <span className="text-amber-400">📣</span>
            Jornada Académica y Cultural
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-3 tracking-tight">
            Propón una actividad
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-lg mx-auto">
            ¿Tienes una conferencia, taller o actividad cultural que quieras compartir?
            Cuéntanos tu idea.
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="max-w-2xl mx-auto px-4 -mt-4 mb-6 relative z-10">
        <div className="bg-white dark:bg-[#122A1C] rounded-2xl border border-gray-100 dark:border-emerald-900/40 shadow-sm p-4">
          <div className="flex items-center justify-between">
            {STEP_LABELS.map((label, i) => {
              const s = i + 1
              return (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <StepIndicator step={s} current={step} />
                  <span className={`text-xs font-bold hidden sm:block transition-colors
                                   ${step === s ? 'text-gray-900 dark:text-gray-100' : step > s ? 'text-[#1B4332] dark:text-emerald-400' : 'text-gray-400 dark:text-gray-600'}`}>
                    {label}
                  </span>
                  {i < STEP_LABELS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${step > s ? 'bg-[#1B4332]' : 'bg-gray-200 dark:bg-emerald-900/40'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="max-w-2xl mx-auto px-4 pb-16">

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 border-l-4 border-red-400
                          text-red-700 dark:text-red-400 text-sm rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ── PASO 1: Tus datos ── */}
          {step === 1 && (
            <div className="bg-white dark:bg-[#122A1C] rounded-3xl border border-gray-100 dark:border-emerald-900/40 shadow-sm p-6 sm:p-10 space-y-5">
              <div className="pb-4 border-b border-gray-50 dark:border-emerald-900/30">
                <h2 className="font-black text-gray-900 dark:text-gray-100 text-base">Cuéntanos quién eres</h2>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">
                  Necesitamos tus datos para ponernos en contacto contigo.
                </p>
              </div>

              <Field label="Nombre completo" required>
                <input
                  name="nombre_completo"
                  value={form.nombre_completo}
                  onChange={handleChange}
                  placeholder="Ej. María García Torres"
                  className={INPUT_CLASS}
                  autoFocus
                />
              </Field>

              <Field label="Correo electrónico" required>
                <input
                  type="email"
                  name="correo"
                  value={form.correo}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                  className={INPUT_CLASS}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Relación con la institución">
                  <select
                    name="relacion_institucion"
                    value={form.relacion_institucion}
                    onChange={handleChange}
                    className={INPUT_CLASS}
                  >
                    {RELACIONES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Teléfono" hint="(opcional)">
                  <input
                    name="telefono"
                    value={form.telefono}
                    onChange={handleChange}
                    placeholder="712 123 4567"
                    className={INPUT_CLASS}
                  />
                </Field>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full py-3.5 bg-[#1B4332] text-white font-black text-sm
                           uppercase tracking-widest rounded-xl hover:bg-emerald-800
                           transition-all hover:-translate-y-0.5 shadow-sm
                           flex items-center justify-center gap-2 mt-2"
              >
                Continuar <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ── PASO 2: Tu propuesta ── */}
          {step === 2 && (
            <div className="bg-white dark:bg-[#122A1C] rounded-3xl border border-gray-100 dark:border-emerald-900/40 shadow-sm p-6 sm:p-10 space-y-6">
              <div className="pb-4 border-b border-gray-50 dark:border-emerald-900/30">
                <h2 className="font-black text-gray-900 dark:text-gray-100 text-base">Cuéntanos tu idea</h2>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">
                  Describe qué quieres compartir con la comunidad.
                </p>
              </div>

              {/* Tipo de actividad */}
              <Field label="Tipo de actividad" required>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  {TIPOS.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => {
                        setForm(prev => ({ ...prev, tipo_actividad: t.value }))
                        if (error) setError(null)
                      }}
                      className={`relative p-4 rounded-2xl border-2 text-left transition-all
                                  hover:-translate-y-0.5
                                  ${form.tipo_actividad === t.value
                                    ? 'border-[#1B4332] bg-emerald-50/60 dark:bg-emerald-900/20 shadow-sm'
                                    : 'border-gray-100 dark:border-emerald-900/40 bg-white dark:bg-[#0F2018] hover:border-gray-200 dark:hover:border-emerald-800'}`}
                    >
                      {form.tipo_actividad === t.value && (
                        <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full
                                        bg-[#1B4332] flex items-center justify-center">
                          <Check size={9} strokeWidth={3} className="text-white" />
                        </div>
                      )}
                      <span className="text-2xl block mb-2">{t.emoji}</span>
                      <p className={`text-sm font-bold leading-tight
                                    ${form.tipo_actividad === t.value ? 'text-[#1B4332] dark:text-emerald-400' : 'text-gray-800 dark:text-gray-300'}`}>
                        {t.label}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-tight">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </Field>

              {/* Título */}
              <Field label="Título de la propuesta" required>
                <input
                  name="titulo"
                  value={form.titulo}
                  onChange={handleChange}
                  placeholder="Ej. Introducción a la inteligencia artificial"
                  className={INPUT_CLASS}
                />
              </Field>

              {/* Descripción */}
              <Field label="Descripción" required hint="¿De qué trata? ¿Qué aprenderán?">
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Explica brevemente el contenido, objetivos y lo que aprenderán los asistentes..."
                  className={INPUT_CLASS + ' resize-none'}
                />
              </Field>

              {/* Duración + Programa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Duración estimada">
                  <select
                    name="duracion_estimada"
                    value={form.duracion_estimada}
                    onChange={handleChange}
                    className={INPUT_CLASS}
                  >
                    {['30 minutos','1 hora','1.5 horas','2 horas','Más de 2 horas'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Dirigido a" hint="(puedes seleccionar varios)">
                  <div className="flex flex-wrap gap-2 pt-1">
                    {PROGRAMAS.map(p => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => toggleArray('dirigido_a', p.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border
                                    ${form.dirigido_a.includes(p.value)
                                      ? 'text-white border-transparent shadow-sm'
                                      : 'bg-white dark:bg-[#0F2018] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-emerald-900/40 hover:border-gray-300 dark:hover:border-emerald-700'}`}
                        style={form.dirigido_a.includes(p.value)
                          ? { background: p.color, borderColor: p.color }
                          : {}}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              {/* Toggles en sección separada */}
              <div className="bg-gray-50 dark:bg-[#0F2018] rounded-2xl p-5 border border-gray-100 dark:border-emerald-900/40 space-y-1 divide-y divide-gray-100 dark:divide-emerald-900/30">
                <Toggle
                  label="¿Requieres materiales o equipo especial?"
                  hint="Proyector, audio, mesas de trabajo, etc."
                  checked={form.requiere_materiales}
                  onChange={val => setForm(p => ({ ...p, requiere_materiales: val }))}
                />
                {form.requiere_materiales && (
                  <div className="pt-3">
                    <textarea
                      name="materiales_descripcion"
                      value={form.materiales_descripcion}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Describe qué necesitarías..."
                      className={INPUT_CLASS + ' resize-none'}
                    />
                  </div>
                )}

                <Toggle
                  label="¿Representas alguna institución?"
                  hint="Universidad, empresa u organización"
                  checked={form.representa_institucion}
                  onChange={val => setForm(p => ({ ...p, representa_institucion: val }))}
                />
                {form.representa_institucion && (
                  <div className="pt-3">
                    <input
                      name="nombre_institucion"
                      value={form.nombre_institucion}
                      onChange={handleChange}
                      placeholder="Nombre de la institución"
                      className={INPUT_CLASS}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleBack}
                        className="flex-1 py-3 border-2 border-gray-200 dark:border-emerald-900/40 text-gray-600 dark:text-gray-400
                                   font-bold rounded-xl hover:border-gray-300 dark:hover:border-emerald-800 hover:bg-gray-50 dark:hover:bg-[#0F2018]
                                   transition-all text-sm">
                  ← Atrás
                </button>
                <button type="button" onClick={handleNext}
                        className="flex-[2] py-3 bg-[#1B4332] text-white font-black text-sm
                                   uppercase tracking-widest rounded-xl hover:bg-emerald-800
                                   transition-all hover:-translate-y-0.5 shadow-sm
                                   flex items-center justify-center gap-2">
                  Continuar <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── PASO 3: Disponibilidad ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-[#122A1C] rounded-3xl border border-gray-100 dark:border-emerald-900/40 shadow-sm p-6 sm:p-10 space-y-6">
                <div className="pb-4 border-b border-gray-50 dark:border-emerald-900/30">
                  <h2 className="font-black text-gray-900 dark:text-gray-100 text-base">¿Cuándo puedes participar?</h2>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">
                    Selecciona los días y el horario que mejor se adapta a ti.
                  </p>
                </div>

                {/* Días disponibles */}
                <Field label="Días de disponibilidad">
                  {dias.length === 0 ? (
                    <p className="text-gray-400 dark:text-gray-500 text-sm italic mt-2">
                      Sin días registrados aún en esta jornada.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {dias.map(dia => {
                        const d     = new Date(dia.fecha + 'T12:00:00')
                        const label = d.toLocaleDateString('es-MX', {
                          weekday: 'short', day: 'numeric', month: 'short'
                        })
                        const sel   = form.dias_disponibles.includes(dia.fecha)
                        return (
                          <button
                            key={dia.id}
                            type="button"
                            onClick={() => toggleArray('dias_disponibles', dia.fecha)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-bold
                                        transition-all border-2
                                        ${sel
                                          ? 'bg-[#1B4332] text-white border-[#1B4332] shadow-sm'
                                          : 'bg-white dark:bg-[#0F2018] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-emerald-900/40 hover:border-[#1B4332]/30 dark:hover:border-emerald-700/50'}`}
                          >
                            {sel && <Check size={11} strokeWidth={3} className="inline mr-1 -mt-0.5" />}
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </Field>

                {/* Horario */}
                <Field label="Horario preferido">
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {[
                      { value: 'mañana',          label: 'Mañana',    sub: '9:00 — 11:00'  },
                      { value: 'mediodia',         label: 'Mediodía',  sub: '11:00 — 13:00' },
                      { value: 'tarde',            label: 'Tarde',     sub: '13:00 — 15:00' },
                      { value: 'sin_preferencia',  label: 'Sin preferencia', sub: 'Cualquier horario' },
                    ].map(h => (
                      <button
                        key={h.value}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, horario_preferido: h.value }))}
                        className={`p-3.5 rounded-xl border-2 text-left transition-all
                                    ${form.horario_preferido === h.value
                                      ? 'border-[#1B4332] bg-emerald-50/60 dark:bg-emerald-900/20'
                                      : 'border-gray-100 dark:border-emerald-900/40 hover:border-gray-200 dark:hover:border-emerald-800'}`}
                      >
                        <p className={`text-sm font-bold ${form.horario_preferido === h.value ? 'text-[#1B4332] dark:text-emerald-400' : 'text-gray-800 dark:text-gray-300'}`}>
                          {h.label}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{h.sub}</p>
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              {/* Info y submit */}
              <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/40 rounded-2xl p-4
                              text-sm text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed">
                ℹ️ Una vez enviada, la coordinación académica revisará tu propuesta
                y se pondrá en contacto contigo en 3 a 5 días hábiles.
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={handleBack}
                        className="flex-1 py-3.5 border-2 border-gray-200 text-gray-600
                                   font-bold rounded-xl hover:border-gray-300 hover:bg-gray-50
                                   transition-all text-sm">
                  ← Atrás
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-3.5 bg-[#D97706] hover:bg-amber-600 text-white
                             font-black text-sm uppercase tracking-widest rounded-xl
                             transition-all hover:-translate-y-0.5 shadow-lg
                             shadow-amber-900/20 disabled:opacity-50
                             flex items-center justify-center gap-2"
                >
                  {loading ? 'Enviando...' : <>Enviar propuesta <ArrowRight size={16} /></>}
                </button>
              </div>

              <p className="text-xs text-gray-400 dark:text-gray-500 text-center pb-4">
                Al enviar, acepto que la información proporcionada sea utilizada para la
                gestión de la agenda académica de la institución.
              </p>
            </div>
          )}

        </form>
      </div>
    </div>
  )
}
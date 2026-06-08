import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check, ChevronRight, Rocket, Star, Mail, Phone, GraduationCap, MapPin, Sparkles } from 'lucide-react'
import { jornadaService }    from '../../services/jornada.service'
import { propuestasService } from '../../services/propuestas.service'
import SEO from '../../components/SEO'

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
  { value: 'sistemas',            label: 'Ing. sistemas',           color: '#D4A017' },
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

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
}

// ─── Toggle component ─────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label, hint }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{label}</p>
        {hint && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-7 rounded-full transition-all shrink-0 border-2 focus:outline-none
                    ${checked ? 'bg-ues-green border-ues-green' : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm
                          ${checked ? 'translate-x-6' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

// ─── Field component ──────────────────────────────────────────────────────────
function Field({ label, required, hint, children }) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
        {label}
        {required && <span className="text-ues-gold ml-1">*</span>}
        {hint && <span className="text-gray-400 font-normal ml-1.5 text-[10px] normal-case tracking-normal">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

const INPUT_CLASS = `w-full px-5 py-4 bg-white dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl
                     focus:border-ues-green dark:focus:border-ues-gold focus:ring-4 focus:ring-ues-green/5
                     outline-none transition-all text-sm font-bold text-gray-900 dark:text-white
                     placeholder:text-gray-300 dark:placeholder:text-gray-600`

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ step, current }) {
  const done   = current > step
  const active = current === step
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm
                     font-black transition-all shrink-0
                     ${done   ? 'bg-ues-green text-apple shadow-lg'
                     : active ? 'bg-white text-ues-green shadow-xl ring-2 ring-ues-green'
                              : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
      {done ? <Check size={16} strokeWidth={4} /> : `0${step}`}
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
  const [step,     setStep]     = useState(1) 
  const [finalizada, setFinalizada] = useState(false)

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
        setLoading(true)
        const j = await jornadaService.getActiva()
        setJornada(j)
        if (j) {
          const diasOrdenados = (j.dias_jornada || [])
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
          setDias(diasOrdenados)
          setForm(prev => ({ ...prev, jornada_id: j.id }))

          const hoy = new Date()
          const fin = new Date(j.fecha_fin + 'T23:59:59')
          if (hoy > fin) setFinalizada(true)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
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

  if (success) return (
    <div className="min-h-screen bg-[#FCFCFC] dark:bg-surface-dark-bg flex items-center justify-center px-6 pt-24 pb-20">
      <motion.div initial="initial" animate="animate" variants={fadeInUp} className="max-w-2xl w-full text-center">
        <div className="w-24 h-24 rounded-[2.5rem] bg-ues-green flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-ues-green/20">
          <Check size={40} className="text-apple" />
        </div>
        <h2 className="text-5xl font-serif font-black text-gray-900 dark:text-white mb-6 tracking-tighter italic">¡Propuesta Recibida!</h2>
        <p className="text-gray-500 dark:text-gray-400 text-xl font-medium mb-12 max-w-lg mx-auto leading-relaxed">Recibimos tus datos correctamente. Evaluaremos tu participación académica muy pronto.</p>
        
        <div className="bg-white dark:bg-surface-dark-card p-10 rounded-[3.5rem] border-2 border-ues-gold/10 shadow-bento dark:shadow-bento-dark text-left mb-12">
          <p className="text-[10px] font-black text-gray-300 dark:text-ues-gold/30 uppercase tracking-[0.4em] mb-4">Confirmación de Registro</p>
          <h3 className="text-2xl font-serif font-black text-gray-900 dark:text-white mb-2">{form.titulo}</h3>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">{form.nombre_completo} · {RELACIONES.find(r => r.value === form.relacion_institucion)?.label}</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <button
            onClick={() => { setSuccess(false); setStep(1); setForm(prev => ({ ...prev, titulo: '', descripcion: '', tipo_actividad: '' })) }}
            className="px-10 py-5 bg-ues-green text-white font-black uppercase text-xs tracking-widest rounded-full hover:bg-emerald-900 transition-all shadow-xl shadow-ues-green/30"
          >
            Nueva Propuesta
          </button>
          <Link
            to="/agenda"
            className="px-10 py-5 border-2 border-gray-100 dark:border-white/10 text-gray-500 dark:text-gray-400 font-black uppercase text-xs tracking-widest rounded-full hover:bg-gray-50 dark:hover:bg-white/5 transition-all shadow-sm"
          >
            Ver Agenda
          </Link>
        </div>
      </motion.div>
    </div>
  )

  if (loading && !jornada) return (
    <div className="min-h-screen bg-[#FCFCFC] dark:bg-surface-dark-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-ues-green animate-spin" />
        <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.3em]">Cargando Plataforma...</p>
      </div>
    </div>
  )

  if (finalizada) return (
    <div className="min-h-screen bg-[#FCFCFC] dark:bg-surface-dark-bg flex items-center justify-center px-6 pt-24 pb-20 text-center">
      <div className="max-w-2xl">
        <div className="w-24 h-24 rounded-[2.5rem] bg-ues-green flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-ues-green/20">
          <Rocket size={40} className="text-apple" />
        </div>
        <h2 className="text-5xl sm:text-7xl font-serif font-black text-gray-900 dark:text-white mb-6 tracking-tighter italic">Convocatoria Cerrada</h2>
        <p className="text-gray-400 font-medium text-xl mb-12 leading-relaxed">El periodo de recepción de propuestas para esta edición académica ha concluido. Agradecemos profundamente tu interés institucional.</p>
        <Link to="/" className="inline-flex items-center gap-4 bg-ues-green text-white px-12 py-6 rounded-full font-black uppercase text-xs tracking-widest hover:bg-emerald-900 transition-all shadow-2xl shadow-ues-green/30">
          Regresar al Inicio <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  )

  const STEP_LABELS = ['Perfil', 'Propuesta', 'Logística']

  return (
    <>
      <SEO title="Proponer Actividad" />
      <div className="min-h-screen bg-[#FCFCFC] dark:bg-surface-dark-bg">

      {/* Editorial Header */}
      <header className="relative bg-ues-green pt-40 pb-20 px-6 overflow-hidden border-b-8 border-ues-gold">
        <div className="absolute inset-0 opacity-10 pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-apple/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 text-apple text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-[0.4em] mb-10 backdrop-blur-md">
            <Sparkles size={14} className="text-ues-gold" fill="currentColor" />
            Call for Talent
          </div>

          <h1 className="text-5xl sm:text-7xl font-serif font-black text-white leading-tight mb-6 tracking-tighter italic">
            Comparte tu <span className="text-ues-gold underline decoration-ues-gold/20">Saber</span>.
          </h1>
          <p className="text-emerald-100/60 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            Buscamos expertos, creativos e investigadores para la 12va Jornada Académica UESSJR. Sé parte de la excelencia regional.
          </p>
        </div>
      </header>

      {/* Bento Stepper */}
      <div className="max-w-[1600px] mx-auto px-6 -mt-10 mb-12 relative z-10">
        <div className="bg-white dark:bg-surface-dark-card rounded-[3rem] border-2 border-ues-gold/10 shadow-2xl p-6 flex flex-col md:flex-row items-center justify-center gap-12">
          {STEP_LABELS.map((label, i) => {
            const s = i + 1
            return (
              <div key={s} className="flex items-center gap-5">
                <StepIndicator step={s} current={step} />
                <span className={`text-xs font-black uppercase tracking-[0.3em] transition-colors
                                 ${step === s ? 'text-gray-900 dark:text-white' : step > s ? 'text-ues-green dark:text-ues-gold' : 'text-gray-300'}`}>
                  {label}
                </span>
                {i < STEP_LABELS.length - 1 && (
                  <div className="hidden lg:block w-20 h-0.5 bg-gray-100 dark:bg-white/5 rounded-full" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-6 pb-32">
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} 
                      className="mb-8 p-6 bg-red-50 dark:bg-red-950/20 border-l-8 border-red-500 text-red-700 dark:text-red-400 text-sm font-bold rounded-2xl flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 shadow-lg">!</div>
             {error}
          </motion.div>
        )}

        <div className="bg-white dark:bg-surface-dark-card rounded-[4rem] border-2 border-ues-gold/10 shadow-bento dark:shadow-bento-dark overflow-hidden p-8 sm:p-16">
          <form onSubmit={handleSubmit} className="space-y-12">

            {/* ── PASO 1: Perfil ── */}
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                  <div className="pb-8 border-b border-gray-100 dark:border-white/5">
                    <h2 className="font-serif font-black text-3xl text-gray-900 dark:text-white tracking-tight">Filiación Académica</h2>
                    <p className="text-gray-400 font-medium text-lg mt-2">Dinos quién eres y cómo contactarte.</p>
                  </div>

                  <Field label="Nombre Completo" required>
                    <input
                      name="nombre_completo"
                      value={form.nombre_completo}
                      onChange={handleChange}
                      placeholder="Ej. Dr. Andrés Mondragón"
                      className={INPUT_CLASS}
                    />
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <Field label="Correo Institucional" required>
                      <input
                        type="email"
                        name="correo"
                        value={form.correo}
                        onChange={handleChange}
                        placeholder="ejemplo@uessjr.edu.mx"
                        className={INPUT_CLASS}
                      />
                    </Field>
                    <Field label="Teléfono de Enlace" hint="(opcional)">
                      <input
                        type="tel"
                        name="telefono"
                        value={form.telefono}
                        onChange={handleChange}
                        placeholder="712 000 0000"
                        className={INPUT_CLASS}
                      />
                    </Field>
                  </div>

                  <Field label="Vínculo Institucional">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {RELACIONES.map(r => (
                        <button
                          key={r.value} type="button"
                          onClick={() => setForm(p => ({ ...p, relacion_institucion: r.value }))}
                          className={`px-5 py-4 rounded-2xl border-2 font-bold text-xs transition-all uppercase tracking-widest
                                      ${form.relacion_institucion === r.value 
                                        ? 'bg-ues-green text-white border-ues-green shadow-xl scale-105' 
                                        : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-400 hover:border-ues-gold/30'}`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <div className="pt-10 flex justify-end">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="group flex items-center gap-4 bg-ues-green text-white px-12 py-6 rounded-full font-black uppercase text-xs tracking-widest hover:bg-emerald-900 transition-all shadow-2xl shadow-ues-green/40"
                    >
                      Continuar <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── PASO 2: Propuesta ── */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                  <div className="pb-8 border-b border-gray-100 dark:border-white/5">
                    <h2 className="font-serif font-black text-3xl text-gray-900 dark:text-white tracking-tight italic">Naturaleza de la Idea</h2>
                    <p className="text-gray-400 font-medium text-lg mt-2">Describe el impacto de tu participación.</p>
                  </div>

                  <Field label="Categoría de Actividad" required>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      {TIPOS.map(t => (
                        <button
                          key={t.value} type="button"
                          onClick={() => { setForm(prev => ({ ...prev, tipo_actividad: t.value })); if (error) setError(null) }}
                          className={`relative p-8 rounded-[2.5rem] border-2 text-left transition-all duration-300 flex flex-col gap-4
                                      ${form.tipo_actividad === t.value
                                        ? 'border-ues-green bg-ues-green/5 dark:bg-ues-gold/5 ring-8 ring-ues-green/[0.02] shadow-xl scale-105'
                                        : 'border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:border-ues-gold/20'}`}
                        >
                          <span className="text-4xl">{t.emoji}</span>
                          <div>
                            <p className="font-serif font-black text-xl text-gray-900 dark:text-white leading-tight">{t.label}</p>
                            <p className="text-[11px] text-gray-400 font-medium leading-tight mt-2 uppercase tracking-widest">{t.desc}</p>
                          </div>
                          {form.tipo_actividad === t.value && (
                            <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-ues-green text-apple flex items-center justify-center shadow-lg">
                              <Check size={16} strokeWidth={4} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Título Magistral" required>
                    <input
                      name="titulo"
                      value={form.titulo}
                      onChange={handleChange}
                      placeholder="Ej. Inteligencia Artificial en el Campo"
                      className="w-full bg-transparent border-b-4 border-gray-100 dark:border-white/10 py-6 font-serif font-black text-3xl outline-none focus:border-ues-green transition-all placeholder:text-gray-200"
                    />
                  </Field>

                  <Field label="Abstract Editorial" required hint="¿De qué trata?">
                    <textarea
                      name="descripcion"
                      value={form.descripcion}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Resume el valor académico y los objetivos de tu sesión..."
                      className="w-full bg-gray-50 dark:bg-white/5 rounded-[3rem] p-10 mt-2 outline-none focus:ring-8 ring-ues-green/5 transition-all text-xl font-medium shadow-inner border-2 border-gray-100 dark:border-white/5 resize-none"
                    />
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                    <Field label="Tiempo Estimado">
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

                    <Field label="Perfil de Audiencia" hint="(múltiple)">
                      <div className="flex flex-wrap gap-3 pt-2">
                        {PROGRAMAS.map(p => (
                          <button
                            key={p.value} type="button"
                            onClick={() => toggleArray('dirigido_a', p.value)}
                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border-2
                                        ${form.dirigido_a.includes(p.value)
                                          ? 'text-white shadow-xl scale-110'
                                          : 'bg-white dark:bg-white/5 text-gray-400 border-gray-100 dark:border-white/10 hover:border-ues-gold/30'}`}
                            style={form.dirigido_a.includes(p.value) ? { background: p.color, borderColor: p.color } : {}}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </Field>
                  </div>

                  <div className="bg-ues-green/5 dark:bg-ues-gold/[0.03] rounded-[3rem] p-10 border-2 border-ues-gold/10 space-y-6 shadow-inner">
                    <Toggle
                      label="Requerimientos Técnicos"
                      hint="¿Necesitas proyector, audio o materiales específicos?"
                      checked={form.requiere_materiales}
                      onChange={val => setForm(p => ({ ...p, requiere_materiales: val }))}
                    />
                    {form.requiere_materiales && (
                      <textarea
                        name="materiales_descripcion"
                        value={form.materiales_descripcion}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Describe la infraestructura necesaria..."
                        className={INPUT_CLASS + ' resize-none mt-4'}
                      />
                    )}

                    <div className="h-px bg-ues-gold/20" />

                    <Toggle
                      label="Representación Institucional"
                      hint="¿Vienes de parte de alguna organización?"
                      checked={form.representa_institucion}
                      onChange={val => setForm(p => ({ ...p, representa_institucion: val }))}
                    />
                    {form.representa_institucion && (
                      <input
                        name="nombre_institucion"
                        value={form.nombre_institucion}
                        onChange={handleChange}
                        placeholder="Nombre de la universidad o empresa..."
                        className={INPUT_CLASS + ' mt-4'}
                      />
                    )}
                  </div>

                  <div className="pt-10 flex justify-between items-center">
                    <button type="button" onClick={handleBack} className="text-gray-400 font-black uppercase text-[11px] tracking-widest hover:text-ues-green transition-colors px-6">Atrás</button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="group flex items-center gap-4 bg-ues-green text-white px-12 py-6 rounded-full font-black uppercase text-xs tracking-widest hover:bg-emerald-900 transition-all shadow-2xl shadow-ues-green/40"
                    >
                      Logística <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── PASO 3: Disponibilidad ── */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                  <div className="pb-8 border-b border-gray-100 dark:border-white/5">
                    <h2 className="font-serif font-black text-3xl text-gray-900 dark:text-white tracking-tight">Agenda y Bloques</h2>
                    <p className="text-gray-400 font-medium text-lg mt-2">Dinos cuándo podrías presentarte.</p>
                  </div>

                  <Field label="Fechas Disponibles" required hint="(selecciona todos los posibles)">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      {dias.map(d => {
                        const date = new Date(d.fecha + 'T12:00:00')
                        const isSel = form.dias_disponibles.includes(d.id)
                        return (
                          <button
                            key={d.id} type="button"
                            onClick={() => toggleArray('dias_disponibles', d.id)}
                            className={`p-6 rounded-[2.5rem] border-2 text-left transition-all duration-300 flex items-center justify-between
                                        ${isSel 
                                          ? 'bg-ues-green text-white border-ues-green shadow-xl scale-105' 
                                          : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-500 hover:border-ues-gold/30'}`}
                          >
                            <div className="flex items-center gap-5">
                               <MapPin size={24} className={isSel ? 'text-apple' : 'text-gray-300'} />
                               <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 italic">{d.nombre_dia}</p>
                                  <p className="font-serif font-black text-2xl tracking-tighter">
                                    {date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).toUpperCase()}
                                  </p>
                               </div>
                            </div>
                            {isSel && <div className="w-8 h-8 rounded-full bg-apple text-ues-green flex items-center justify-center shadow-lg"><Check size={16} strokeWidth={4} /></div>}
                          </button>
                        )
                      })}
                    </div>
                  </Field>

                  <Field label="Bloque de Horario Preferido">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {['mañana', 'tarde', 'indiferente'].map(h => (
                        <button
                          key={h} type="button"
                          onClick={() => setForm(p => ({ ...p, horario_preferido: h }))}
                          className={`px-8 py-5 rounded-3xl border-2 font-black text-xs transition-all uppercase tracking-[0.2em]
                                      ${form.horario_preferido === h 
                                        ? 'bg-ues-gold text-white border-ues-gold shadow-xl scale-105' 
                                        : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-400 hover:border-ues-gold/30'}`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <div className="bg-ues-green p-12 rounded-[4rem] shadow-2xl relative overflow-hidden flex items-start gap-8 group border-2 border-ues-gold/20 mt-16">
                    <div className="absolute inset-0 bg-ues-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border-2 border-white/20">
                      <GraduationCap size={32} className="text-ues-gold" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-white font-serif font-black text-3xl mb-4 tracking-tighter">Compromiso Académico</p>
                      <p className="text-emerald-100/60 text-lg leading-relaxed font-medium">Al enviar este formulario, certificas la originalidad de tu trabajo y tu disposición profesional para las fechas seleccionadas.</p>
                    </div>
                  </div>

                  <div className="pt-10 flex justify-between items-center">
                    <button type="button" onClick={handleBack} className="text-gray-400 font-black uppercase text-[11px] tracking-widest hover:text-ues-green transition-colors px-6">Atrás</button>
                    <button 
                      disabled={loading}
                      type="submit" 
                      className="group flex items-center gap-5 bg-ues-green text-white px-20 py-8 rounded-full font-black uppercase text-sm tracking-[0.5em] hover:bg-emerald-900 transition-all shadow-2xl shadow-ues-green/40 disabled:opacity-50"
                    >
                      {loading ? 'Transmitiendo...' : 'Publicar Propuesta'} 
                      {!loading && <Send size={24} className="group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </main>
      </div>
    </>
  )
}

function Send({ size, className }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
  )
}

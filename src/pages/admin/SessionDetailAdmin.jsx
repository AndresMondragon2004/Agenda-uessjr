import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Trash2, ExternalLink, Download, FileSpreadsheet, UserCheck, Loader2, Check } from 'lucide-react'
import { sesionesService } from '../../services/sesiones.service'
import { supabase } from '../../services/supabase'



const TIPO_COLORS = {
  inauguracion: 'bg-blue-100 text-blue-800',
  conferencia:  'bg-emerald-100 text-emerald-800',
  taller:       'bg-amber-100 text-amber-800',
  cultural:     'bg-purple-100 text-purple-800',
  protocolo:    'bg-gray-100 text-gray-700',
  competencia:  'bg-orange-100 text-orange-800',
  cierre:       'bg-rose-100 text-rose-800',
}

const TIPO_LABELS = {
  inauguracion: 'Inauguración',
  conferencia:  'Conferencia',
  taller:       'Taller',
  cultural:     'Cultural',
  protocolo:    'Protocolo',
  competencia:  'Competencia',
  cierre:       'Cierre',
}

const ESTADO_COLORS = {
  activa:    'bg-emerald-100 text-emerald-800',
  borrador:  'bg-amber-100 text-amber-700',
  cancelada: 'bg-red-100 text-red-700',
}

const PROGRAMA_LABELS = {
  sistemas:            'Ing. sistemas',
  innovacion_agricola: 'Ing. innovación agrícola',
  contaduria:          'Contaduría',
  publico_general:     'Público en general',
}



// ─── Delete Modal ──────────────────────────────────────────────────────────
function DeleteModal({ sesion, onClose, onConfirm, deleting }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">¿Eliminar esta sesión?</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
          Se eliminará <strong>"{sesion.nombre}"</strong>.
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mb-6">
          Esta acción eliminará también los registros de inscripciones asociados.
        </p>
        <div className="space-y-3">
          <button type="button" onClick={onConfirm} disabled={deleting}
                  className="w-full py-2.5 bg-red-600 text-white font-semibold rounded-lg
                             hover:bg-red-700 transition-colors disabled:opacity-50">
            {deleting ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
          <button type="button" onClick={onClose}
                  className="w-full py-2.5 text-gray-700 dark:text-gray-300 font-semibold border border-gray-300 dark:border-emerald-900/40
                             rounded-lg hover:bg-gray-50 dark:hover:bg-emerald-900/20 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function SessionDetailAdmin() {
  const { id }   = useParams()
  const navigate = useNavigate()


  const [sesion,          setSesion]          = useState(null)
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState(null)
  const [totalInscritos,  setTotalInscritos]  = useState(0)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting,        setDeleting]        = useState(false)
  const [toast,           setToast]           = useState(null)
  const [exporting,       setExporting]       = useState(false)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  useEffect(() => {
    async function cargar() {
      try {
        setLoading(true)
        const data = await sesionesService.getById(id)
        setSesion(data)
        const count = await sesionesService.getTotalInscritos(id)
        setTotalInscritos(count)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [id])

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await sesionesService.delete(id)
      showToast('Sesión eliminada')
      setTimeout(() => navigate('/admin/sesiones'), 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleExportAttendance = async () => {
    try {
      setExporting(true)
      const { data, error } = await supabase
        .from('inscripciones')
        .select(`
          estudiantes (
            nombre,
            apellidos,
            correo,
            matricula,
            programa_academico
          )
        `)
        .eq('sesion_id', id)
        .eq('estado', 'confirmada')

      if (error) throw error
      if (!data || data.length === 0) {
        alert('No hay estudiantes inscritos en esta sesión aún.')
        return
      }

      // Generar CSV
      const rows = data.map(i => ({
        nombre: i.estudiantes.nombre,
        apellidos: i.estudiantes.apellidos,
        correo: i.estudiantes.correo,
        matricula: i.estudiantes.matricula,
        programa: PROGRAMA_LABELS[i.estudiantes.programa_academico] || i.estudiantes.programa_academico
      }))

      const header = 'Nombre,Apellidos,Matrícula,Correo,Programa Académico\n'
      const csvContent = header + rows.map(r => 
        `"${r.nombre}","${r.apellidos}","${r.matricula}","${r.correo}","${r.programa}"`
      ).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `asistencia-${sesion.nombre.replace(/\s+/g, '-').slice(0, 30)}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      showToast('Lista de asistencia descargada')
    } catch (err) {
      console.error(err)
      alert('Error al exportar lista')
    } finally {
      setExporting(false)
    }
  }

  const fechaFormateada = sesion?.dias_jornada?.fecha
    ? new Date(sesion.dias_jornada.fecha + 'T12:00:00')
        .toLocaleDateString('es-MX', {
          weekday: 'long', day: 'numeric',
          month: 'long', year: 'numeric'
        })
    : null

  const cupo = sesion?.escenarios?.capacidad_maxima || sesion?.cupo_maximo || 0
  const pctOcupacion = cupo ? Math.min((totalInscritos / cupo) * 100, 100) : 0

  return (
    <>
      {/* Topbar */}
      <div className="bg-white dark:bg-[#122A1C] border-b border-gray-100 dark:border-emerald-900/40 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-14 lg:top-0 z-10">
        <button
          type="button"
          onClick={() => navigate('/admin/sesiones')}
          className="text-gray-500 dark:text-gray-400 hover:text-[#1B4332] dark:hover:text-emerald-400 font-semibold text-sm flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Volver a sesiones</span>
        </button>
        <div className="flex gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/sesiones/editar/' + id)}
            style={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)' }}
            className="px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white rounded-xl hover:-translate-y-0.5 hover:shadow-md transition-all shadow-sm flex items-center gap-1.5"
          >
            <Edit2 className="w-4 h-4" /> <span className="hidden sm:inline">Editar sesión</span>
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-red-600 border border-red-100
                       rounded-xl hover:bg-red-50 hover:border-red-300 transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Eliminar</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 bg-emerald-50 dark:bg-emerald-900/20 px-6 py-4 rounded-3xl border border-emerald-100 dark:border-emerald-900/40 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-[#1B4332] text-white flex items-center justify-center shadow-lg">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Inscripciones confirmadas</p>
              <p className="text-xl font-black text-gray-900 dark:text-white leading-none mt-1">{totalInscritos} alumnos</p>
            </div>
          </div>
          
          <button
            onClick={handleExportAttendance}
            disabled={exporting || totalInscritos === 0}
            className="px-6 py-4 bg-white dark:bg-[#122A1C] border border-gray-100 dark:border-emerald-900/40 text-[#1B4332] dark:text-emerald-400 font-black text-[11px] uppercase tracking-widest rounded-3xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            Descargar Lista de Asistencia
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4332] mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Cargando detalles de la sesión...</p>
            </div>
          </div>
        ) : !sesion ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Sesión no encontrada</h2>
            <p className="text-gray-400 mb-6">Esta sesión no existe o fue eliminada del sistema.</p>
            <button type="button" onClick={() => navigate('/admin/sesiones')}
                    className="px-6 py-2.5 bg-[#1B4332] text-white font-semibold rounded-xl">
              Volver al listado
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ── COLUMNA IZQUIERDA: Info Principal ── */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-sm border border-gray-100 dark:border-emerald-900/40 overflow-hidden">
                {/* Header visual */}
                <div className="h-32 sm:h-40 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] relative p-8">
                  <div className="absolute -bottom-6 left-8 flex items-center gap-3">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase shadow-sm border
                      ${TIPO_COLORS[sesion.tipo] || 'bg-white text-gray-700'}`}>
                      {TIPO_LABELS[sesion.tipo] || sesion.tipo}
                    </span>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize shadow-sm border
                      ${ESTADO_COLORS[sesion.estado] || 'bg-white text-gray-600'}`}>
                      {sesion.estado}
                    </span>
                  </div>
                </div>

                <div className="p-8 pt-12">
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 leading-tight mb-8">
                    {sesion.nombre}
                  </h1>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                    {fechaFormateada && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest">Fecha y día</p>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 capitalize">{fechaFormateada}</p>
                      </div>
                    )}
                    {sesion.hora_inicio && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest">Horario programado</p>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                          {sesion.hora_inicio?.slice(0, 5)} — {sesion.hora_fin?.slice(0, 5)} hrs
                        </p>
                      </div>
                    )}
                    {sesion.escenarios?.nombre && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest">Sede / escenario</p>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                          {sesion.escenarios.nombre}
                          {sesion.escenarios.capacidad_maxima && (
                            <span className="text-gray-400 dark:text-gray-500 font-medium ml-1"> (Capacidad: {sesion.escenarios.capacidad_maxima})</span>
                          )}
                        </p>
                      </div>
                    )}
                    {(sesion.programa_academico || []).length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest">Público objetivo</p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {sesion.programa_academico.map(p => (
                            <span key={p} className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 text-[10px] px-2.5 py-1 rounded-lg font-black uppercase">
                              {PROGRAMA_LABELS[p] || p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {sesion.descripcion && (
                    <div className="border-t border-gray-50 dark:border-emerald-900/30 pt-8 mt-8">
                      <h3 className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-4">Sinopsis de la actividad</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{sesion.descripcion}</p>
                    </div>
                  )}

                  {sesion.requiere_materiales && sesion.materiales_requeridos && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-6 border border-amber-100 dark:border-amber-800/40 mt-8">
                      <h3 className="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-black tracking-widest mb-3">Requerimientos técnicos / materiales</h3>
                      <p className="text-amber-800 dark:text-amber-300 text-sm font-medium">{sesion.materiales_requeridos}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card de Ponente */}
              {sesion.ponente_nombre && (
                <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-sm p-8 border border-gray-100 dark:border-emerald-900/40">
                  <h3 className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-6">
                    Perfil del facilitador / ponente
                  </h3>
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                    {sesion.ponente_foto_url ? (
                      <img src={sesion.ponente_foto_url} alt={sesion.ponente_nombre}
                           className="w-24 h-24 rounded-2xl object-cover shrink-0 border-4 border-gray-50 dark:border-emerald-900/40 shadow-sm" />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/40 dark:to-emerald-900/60 flex items-center justify-center shrink-0 border-4 border-white dark:border-emerald-900/40 shadow-sm">
                        <span className="text-[#1B4332] dark:text-emerald-400 text-3xl font-black">
                          {sesion.ponente_nombre.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 text-center sm:text-left">
                      <div className="mb-4">
                        <p className="font-black text-gray-900 dark:text-gray-100 text-xl">
                          {sesion.ponente_grado} {sesion.ponente_nombre}
                        </p>
                        {sesion.ponente_institucion && (
                          <span className="inline-block mt-1 bg-gray-100 dark:bg-[#0F2018] text-gray-600 dark:text-gray-400 text-[10px] px-3 py-1 rounded-full font-bold">
                            {sesion.ponente_institucion}
                          </span>
                        )}
                      </div>

                      {sesion.ponente_perfil_publico && (
                        <div className="space-y-2">
                          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                            {sesion.ponente_perfil_publico}
                          </p>
                          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Visible en el programa público
                          </div>
                        </div>
                      )}

                      {sesion.ponente_cv_privado && (
                        <div className="mt-6 p-5 bg-gray-50 dark:bg-[#0F2018] rounded-2xl border border-gray-100 dark:border-emerald-900/30">
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-2">Información interna (CV/Privado)</p>
                          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                            {sesion.ponente_cv_privado}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── COLUMNA DERECHA: Métricas y Acciones ── */}
            <div className="space-y-6">
              {/* Card de Inscripciones */}
              <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-sm p-8 border border-gray-100 dark:border-emerald-900/40">
                <h3 className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-6 text-center">Registro de asistencia</h3>
                <div className="flex flex-col items-center mb-6">
                  <div className="relative">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100 dark:text-emerald-900/50" />
                      <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent"
                              strokeDasharray={2 * Math.PI * 58}
                              strokeDashoffset={2 * Math.PI * 58 * (1 - pctOcupacion / 100)}
                              className={`${pctOcupacion >= 100 ? 'text-red-500' : pctOcupacion >= 80 ? 'text-amber-500' : 'text-[#1B4332]'} transition-all duration-1000`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-gray-900 dark:text-white">{totalInscritos}</span>
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Inscritos</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Cupo total</span>
                    <span className="text-gray-900 dark:text-gray-100 font-black">{cupo || 'Ilimitado'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Lugares libres</span>
                    <span className={`font-black ${cupo - totalInscritos <= 5 ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}`}>
                      {cupo ? Math.max(cupo - totalInscritos, 0) : '∞'}
                    </span>
                  </div>
                  {totalInscritos >= cupo && cupo > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-wider py-2 rounded-xl text-center border border-red-100 dark:border-red-900/40">
                      ⚠️ Sesión Completa
                    </div>
                  )}
                </div>
              </div>

              {/* Información de Metadatos */}
              <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-emerald-900/40">
                <h3 className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-black tracking-widest mb-4">Información del sistema</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 dark:text-gray-500">ID de Referencia</span>
                    <span className="text-gray-900 dark:text-gray-100 font-mono font-bold">{sesion.id?.slice(0, 12)}</span>
                  </div>
                  {sesion.instituciones?.nombre && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400 dark:text-gray-500">Institución</span>
                      <span className="text-gray-900 dark:text-gray-100 font-bold text-right">{sesion.instituciones.nombre}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs pt-3 border-t border-gray-50 dark:border-emerald-900/30">
                    <span className="text-gray-400 dark:text-gray-500">Última actualización</span>
                    <span className="text-gray-900 dark:text-gray-100 font-bold">
                      {new Date(sesion.updated_at).toLocaleDateString('es-MX')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Enlace externo */}
              <button
                type="button"
                onClick={() => window.open(`/agenda/${id}`, '_blank')}
                className="w-full py-4 bg-gray-50 dark:bg-[#0F2018] hover:bg-gray-100 dark:hover:bg-emerald-900/20 text-gray-600 dark:text-gray-300 rounded-2xl transition-all border border-gray-200 dark:border-emerald-900/40 flex items-center justify-center gap-2 group"
              >
                <span className="text-xs font-bold uppercase tracking-widest">Ver en agenda pública</span>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete modal */}
      {showDeleteModal && sesion && (
        <DeleteModal
          sesion={sesion}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-50 bg-emerald-600 text-white
                        px-8 py-4 rounded-2xl shadow-2xl text-sm font-black flex items-center gap-3 animate-bounce">
          <div className="bg-white/20 p-1 rounded-full"><Check className="w-4 h-4" /></div>
          {toast}
        </div>
      )}
    </>
  )
}

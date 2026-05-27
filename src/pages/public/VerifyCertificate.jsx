import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShieldCheck, User, Calendar, CheckCircle2, XCircle, ArrowLeft, Loader2, Award } from 'lucide-react'
import { supabase } from '../../services/supabase'

const PROGRAMA_ABBR = {
  sistemas:            'ISC',
  innovacion_agricola: 'IIAS',
  contaduria:          'LC',
}

export default function VerifyCertificate() {
  const { codigo } = useParams()
  const [loading, setLoading] = useState(true)
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(null)

  const verificar = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const parts = codigo.split('-')
      
      if (parts.length < 7 || parts[0] !== 'VERIFY') {
        throw new Error('Formato de código inválido')
      }

      const studentId = parts.slice(1, 6).join('-').toLowerCase()
      
      const { data: est, error: eErr } = await supabase
        .from('estudiantes')
        .select(`
          nombre, apellidos, matricula, programa_academico,
          asistencias(id)
        `)
        .eq('id', studentId)
        .single()

      if (eErr || !est) throw new Error('Constancia no encontrada en nuestros registros')

      if (!est.asistencias || est.asistencias.length === 0) {
        throw new Error('Esta constancia no cuenta con asistencias verificadas')
      }

      setDatos(est)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (codigo) {
      verificar()
    } else {
      setLoading(false)
    }
  }, [codigo])

  return (
    <div className="min-h-screen bg-[#F8FAFB] dark:bg-[#0A1A11] flex items-center justify-center p-4 sm:p-8">
      
      <div className="w-full max-w-2xl bg-white dark:bg-[#122A1C] rounded-[3rem] shadow-2xl border border-gray-100 dark:border-emerald-900/30 overflow-hidden relative">
        
        {/* Decoración */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />
        
        <div className="p-8 sm:p-12">
          
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-[#1B4332] mx-auto mb-4" />
              <p className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Validando con el servidor...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                <XCircle size={48} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Error de Validación</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">{error}</p>
              <Link to="/" className="inline-flex items-center gap-2 text-[#1B4332] dark:text-emerald-400 font-bold hover:underline">
                <ArrowLeft size={16} /> Volver al portal
              </Link>
            </div>
          ) : (
            <div className="anim-fade-up">
              <div className="flex items-center justify-center gap-3 mb-8">
                <ShieldCheck className="text-emerald-500" size={32} />
                <h1 className="text-xl font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-tighter">Documento Verificado</h1>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-[2rem] p-8 border border-emerald-100 dark:border-emerald-800/50 relative overflow-hidden">
                <Award className="absolute -right-4 -bottom-4 text-emerald-500/10" size={120} />
                
                <div className="relative z-10 space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-1">Titular de la Constancia</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">
                      {datos.nombre} {datos.apellidos}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Matrícula</p>
                      <p className="font-bold text-gray-700 dark:text-gray-300">{datos.matricula}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Carrera</p>
                      <p className="font-bold text-gray-700 dark:text-gray-300 uppercase truncate">
                        {PROGRAMA_ABBR[datos.programa_academico] || datos.programa_academico}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-emerald-200/50 dark:border-emerald-800/50">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Evento</p>
                    <p className="font-bold text-gray-700 dark:text-gray-300">12va Jornada Académica y Cultural UESSJR</p>
                    <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase tracking-widest">Mayo 2026 · Estado de México</p>
                  </div>
                </div>
              </div>

              <div className="mt-10 text-center">
                <p className="text-[10px] text-gray-400 font-bold leading-relaxed max-w-sm mx-auto">
                  Este documento ha sido validado electrónicamente a través de la plataforma oficial de la Unidad de Estudios Superiores San José del Rincón.
                </p>
                <div className="mt-8">
                   <Link to="/" className="bg-[#1B4332] text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/20">
                    Portal de Jornada
                   </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, Globe } from 'lucide-react'
import AuthLayout from '../../components/layout/AuthLayout'

export default function Terms() {
  return (
    <AuthLayout>
      <div className="mb-8">
        <Link to="/registro" className="inline-flex items-center text-xs font-black uppercase tracking-widest text-gray-400 hover:text-[#0d261a] dark:hover:text-emerald-400 mb-6 transition-colors group">
          <ArrowLeft size={14} className="mr-2 transition-transform group-hover:-translate-x-1" /> Volver al registro
        </Link>
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-2 tracking-tight">Términos y condiciones</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
          Última actualización: 9 de mayo de 2026
        </p>
      </div>

      <div className="space-y-8 max-h-[50vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-emerald-900/50 text-justify">
        
        <section>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-[#1B4332] dark:text-emerald-400">
              <ShieldCheck size={18} />
            </div>
            <h2 className="font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest text-[11px]">1. Aceptación de los términos</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Al registrarse en la plataforma UESSJR Agenda, usted acepta cumplir y estar sujeto a estos Términos y condiciones de uso, así como a todas las leyes y regulaciones institucionales aplicables de la Universidad Mexiquense del Bicentenario.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-[#1B4332] dark:text-emerald-400">
              <Lock size={18} />
            </div>
            <h2 className="font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest text-[11px]">2. Uso de la cuenta</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            El acceso a esta plataforma es exclusivamente para fines académicos. Usted es responsable de mantener la confidencialidad de su contraseña y de todas las actividades que ocurran bajo su cuenta institucional.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-[#1B4332] dark:text-emerald-400">
              <Eye size={18} />
            </div>
            <h2 className="font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest text-[11px]">3. Protección de datos</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Sus datos personales (nombre, correo institucional y carrera) serán utilizados únicamente para la gestión de inscripciones, generación de constancias y control de asistencia a los eventos de la Jornada Académica y Cultural. No compartimos su información con terceros externos.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-[#1B4332] dark:text-emerald-400">
              <FileText size={18} />
            </div>
            <h2 className="font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest text-[11px]">4. Comportamiento en eventos</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            La inscripción a las sesiones conlleva el compromiso de asistencia y participación respetuosa. El uso indebido de los enlaces de acceso o la suplantación de identidad resultará en la baja definitiva del sistema.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-[#1B4332] dark:text-emerald-400">
              <Globe size={18} />
            </div>
            <h2 className="font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest text-[11px]">5. Propiedad intelectual</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Todo el contenido compartido durante las jornadas (presentaciones, videos, documentos) es propiedad de sus respectivos autores y de la UMB. Queda prohibida su reproducción total o parcial sin autorización expresa.
          </p>
        </section>

      </div>

      <div className="mt-10 pt-8 border-t border-gray-50 dark:border-emerald-900/20 space-y-6">
        <Link to="/registro"
              className="block w-full py-4 bg-[#0d261a] text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-[#163a2a] transition-all text-center shadow-xl shadow-emerald-900/30">
          Entendido y volver
        </Link>
        <p className="text-[10px] text-gray-400 dark:text-gray-600 font-black tracking-widest uppercase text-center">
          © 2026 UESSJR AGENDA · UMB
        </p>
      </div>
    </AuthLayout>
  )
}

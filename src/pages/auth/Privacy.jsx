import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Eye, Database, Bell, UserCheck } from 'lucide-react'
import AuthLayout from '../../components/layout/AuthLayout'

export default function Privacy() {
  return (
    <AuthLayout>
      <div className="mb-8">
        <Link to="/registro" className="inline-flex items-center text-xs font-black uppercase tracking-widest text-gray-400 hover:text-[#0d261a] dark:hover:text-emerald-400 mb-6 transition-colors group">
          <ArrowLeft size={14} className="mr-2 transition-transform group-hover:-translate-x-1" /> Volver al registro
        </Link>
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-2 tracking-tight">Aviso de privacidad</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
          UES San José del Rincón · UMB
        </p>
      </div>

      <div className="space-y-8 max-h-[50vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-emerald-900/50 text-justify">
        
        <section>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <Shield size={18} />
            </div>
            <h2 className="font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest text-[11px]">1. Responsable del tratamiento</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            La Universidad Mexiquense del Bicentenario (UMB), a través de la Unidad de Estudios Superiores San José del Rincón, es la responsable del tratamiento de los datos personales que nos proporcione, los cuales serán protegidos conforme a lo dispuesto por la Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <Database size={18} />
            </div>
            <h2 className="font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest text-[11px]">2. Datos recabados</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Para los fines de la Jornada Académica y Cultural, recabamos los siguientes datos:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400 list-disc pl-5">
            <li>Nombre completo y apellidos.</li>
            <li>Matrícula estudiantil.</li>
            <li>Correo electrónico institucional.</li>
            <li>Programa académico (Carrera).</li>
          </ul>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <Eye size={18} />
            </div>
            <h2 className="font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest text-[11px]">3. Finalidad del tratamiento</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Los datos personales serán utilizados exclusivamente para:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400 list-disc pl-5">
            <li>Gestionar el registro e inscripción a las sesiones.</li>
            <li>Controlar el aforo y asistencia a las actividades.</li>
            <li>Generar constancias de participación con validez institucional.</li>
            <li>Enviar notificaciones sobre cambios en la agenda del evento.</li>
          </ul>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <Bell size={18} />
            </div>
            <h2 className="font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest text-[11px]">4. Transferencia de datos</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Se informa que no se realizarán transferencias de datos personales a terceros externos, salvo aquellas que sean estrictamente necesarias para atender requerimientos de información de una autoridad competente, que estén debidamente fundados y motivados.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <UserCheck size={18} />
            </div>
            <h2 className="font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest text-[11px]">5. Derechos ARCO</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Usted tiene derecho a conocer qué datos personales tenemos de usted (Acceso), para qué los utilizamos y las condiciones del uso que les damos. Asimismo, es su derecho solicitar la corrección de su información (Rectificación), que la eliminemos de nuestros registros (Cancelación) o oponerse al uso de sus datos para fines específicos (Oposición).
          </p>
        </section>

      </div>

      <div className="mt-10 pt-8 border-t border-gray-50 dark:border-emerald-900/20 space-y-6">
        <Link to="/registro"
              className="block w-full py-4 bg-[#0d261a] text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-[#163a2a] transition-all text-center shadow-xl shadow-emerald-900/30">
          Acepto y volver
        </Link>
        <p className="text-[10px] text-gray-400 dark:text-gray-600 font-black tracking-widest uppercase text-center">
          UES SAN JOSÉ DEL RINCÓN · COMITÉ DE PRIVACIDAD
        </p>
      </div>
    </AuthLayout>
  )
}

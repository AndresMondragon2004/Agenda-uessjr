import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../services/supabase';
import { User, Calendar, MapPin, ArrowLeft, Download, Share2 } from 'lucide-react';

export default function DigitalTicket() {
  const { id } = useParams();
  const [estudiante, setEstudiante] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarEstudiante() {
      try {
        const { data, error } = await supabase
          .from('estudiantes')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        setEstudiante(data);
      } catch (err) {
        console.error('Error al cargar ticket:', err);
      } finally {
        setLoading(false);
      }
    }
    cargarEstudiante();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-8 h-8 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!estudiante) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Ticket no encontrado</h2>
        <Link to="/" className="text-[#1B4332] font-semibold hover:underline">Volver al inicio</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d261a] p-4 sm:p-8 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        
        {/* Decoración de Ticket */}
        <div className="absolute top-1/2 -left-4 w-8 h-8 bg-[#0d261a] rounded-full -translate-y-1/2 z-10" />
        <div className="absolute top-1/2 -right-4 w-8 h-8 bg-[#0d261a] rounded-full -translate-y-1/2 z-10" />
        <div className="absolute top-1/2 left-4 right-4 border-t-2 border-dashed border-gray-100 -translate-y-1/2" />

        {/* Parte Superior */}
        <div className="p-8 pb-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-emerald-50 rounded-3xl">
              <img src="https://ydcybysimlvatvadpbaz.supabase.co/storage/v1/object/public/images/ues-sjr.png" alt="Logo" className="h-12" />
            </div>
          </div>
          <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-1">Pase de Acceso</h1>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em]">12va Jornada Académica</p>
          
          <div className="mt-8 space-y-4">
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Estudiante</span>
              <span className="text-lg font-bold text-gray-800 leading-tight">{estudiante.nombre} {estudiante.apellidos}</span>
            </div>
            <div className="flex justify-center gap-8">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Matrícula</span>
                <span className="text-sm font-black text-gray-800">{estudiante.matricula}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Programa</span>
                <span className="text-sm font-black text-gray-800 uppercase">{estudiante.programa_academico?.slice(0,3)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Parte Inferior (QR) */}
        <div className="p-10 pt-16 flex flex-col items-center bg-gray-50/50">
          <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-emerald-900/5 mb-8 border border-gray-100">
            <QRCodeSVG 
              value={`student:${estudiante.id}:${estudiante.matricula}`}
              size={180}
              level="H"
              includeMargin={false}
              className="rounded-lg"
            />
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-2">Escanea para asistencia</p>
          <div className="flex items-center gap-2 text-[#1B4332] font-black text-xs uppercase tracking-widest">
            <Calendar size={14} /> Mayo 2026
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="mt-10 flex gap-4 w-full max-w-md">
        <button onClick={() => window.print()} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 backdrop-blur-md">
          <Download size={18} /> Guardar PDF
        </button>
        <button onClick={() => navigator.share({ title: 'Mi Ticket', url: window.location.href })} className="flex-1 bg-[#e2a868] hover:bg-[#d49757] text-[#0d261a] py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2">
          <Share2 size={18} /> Compartir
        </button>
      </div>

      <Link to="/" className="mt-8 text-white/50 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors">
        <ArrowLeft size={14} /> Volver a la agenda
      </Link>
    </div>
  );
}

import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../services/supabase';
import { Calendar, ArrowLeft, Download, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const PROGRAMA_ABBR = {
  sistemas:            'ISC',
  innovacion_agricola: 'IIAS',
  contaduria:          'LC',
}

export default function DigitalTicket() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, loading: authLoading } = useAuth();

  const [estudiante, setEstudiante] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const ticketRef = useRef(null);

  // Redirigir al inicio si el usuario cierra sesión
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, authLoading, navigate]);

  useEffect(() => {
    async function cargarEstudiante() {
      try {
        const { data, error } = await supabase
          .from('estudiantes')
          .select('id, nombre, apellidos, matricula, programa_academico, qr_token')
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

  const handleDownloadPDF = async () => {
    if (!ticketRef.current || !estudiante) return;
    
    try {
      setDownloading(true);
      const loadingToast = toast.loading('Generando tu ticket...');

      // Capturar el ticket con alta resolución
      const canvas = await html2canvas(ticketRef.current, {
        scale: 3, // Mayor calidad
        useCORS: true,
        backgroundColor: '#0d261a', // Fondo oscuro para el área externa si es necesario
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Dimensiones para el PDF (A4)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 210;
      const pageHeight = 297;

      // Pintar el fondo de toda la hoja del mismo verde oscuro (#0d261a)
      // RGB de #0d261a => R:13, G:38, B:26
      pdf.setFillColor(13, 38, 26);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      const imgWidth = 120; // Un poco más ancho para mejor visibilidad
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const xPos = (pageWidth - imgWidth) / 2;
      const yPos = (pageHeight - imgHeight) / 2;

      pdf.addImage(imgData, 'PNG', xPos, yPos, imgWidth, imgHeight);
      pdf.save(`Ticket_Jornada_${estudiante.matricula}.pdf`);
      
      toast.success('Ticket descargado con éxito', { id: loadingToast });
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('No se pudo generar el PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mi Ticket - 12va Jornada Académica',
          text: `Hola, este es mi ticket de acceso para la 12va Jornada Académica.`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error al compartir:', error);
      }
    } else {
      // Fallback: Copiar al portapapeles
      navigator.clipboard.writeText(window.location.href);
      toast.success('Enlace copiado al portapapeles');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0d261a] flex items-center justify-center p-6">
      <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!estudiante) return (
    <div className="min-h-screen bg-[#0d261a] flex items-center justify-center p-6 text-center">
      <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10">
        <h2 className="text-xl font-bold text-white mb-4">Ticket no encontrado</h2>
        <Link to="/" className="text-amber-400 font-bold hover:underline">Volver al inicio</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d261a] p-4 sm:p-8 flex flex-col items-center justify-center font-sans overflow-x-hidden">
      
      {/* Contenedor del Ticket (Lo que se exportará a PDF) */}
      <div ref={ticketRef} className="p-8 bg-[#0d261a] flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden shadow-2xl relative">
          
          {/* Decoración de Ticket (Círculos laterales) */}
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
                  <span className="text-sm font-black text-gray-800 uppercase">
                    {PROGRAMA_ABBR[estudiante.programa_academico] || estudiante.programa_academico?.slice(0, 3)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Parte Inferior (QR) */}
          <div className="p-10 pt-16 flex flex-col items-center bg-gray-50/50">
            <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-emerald-900/5 mb-8 border border-gray-100">
              <QRCodeSVG 
                value={`student:${estudiante.qr_token}:${estudiante.matricula}`}
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
      </div>

      {/* Botones de acción (NO se incluyen en el PDF) */}
      <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full max-w-md px-4">
        <button 
          onClick={handleDownloadPDF} 
          disabled={downloading}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 backdrop-blur-md disabled:opacity-50"
        >
          <Download size={18} /> {downloading ? 'Generando...' : 'Descargar Ticket'}
        </button>
        <button 
          onClick={handleShare}
          className="flex-1 bg-amber-400 hover:bg-amber-500 text-[#0d261a] py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
        >
          <Share2 size={18} /> Compartir
        </button>
      </div>

      <Link to="/" className="mt-8 text-white/50 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors">
        <ArrowLeft size={14} /> Volver a la agenda
      </Link>
    </div>
  );
}

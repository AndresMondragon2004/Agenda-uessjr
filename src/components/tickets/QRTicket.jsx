import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { useSettings } from '../../context/SettingsContext';

/**
 * QRTicket: Componente de ticket digital dinámico.
 * Se adapta automáticamente a los colores de la marca configurada.
 */
const QRTicket = ({ participant, session }) => {
  const { settings } = useSettings();
  const ticketRef = useRef(null);

  const downloadTicket = async () => {
    if (!ticketRef.current) return;
    
    const canvas = await html2canvas(ticketRef.current, {
      scale: 3, // Alta calidad
      backgroundColor: null,
      useCORS: true
    });
    
    const link = document.createElement('a');
    link.download = `Ticket-${session.titulo.substring(0, 15)}-${participant.nombre}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const primaryColor = settings?.branding?.primary_color || '#163020';

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {/* Contenedor del Ticket - Usa variables CSS para el borde y acentos */}
      <div 
        ref={ticketRef}
        className="relative w-[320px] bg-white rounded-3xl shadow-2xl overflow-hidden border-2"
        style={{ borderColor: 'var(--color-primary, #163020)' }}
      >
        {/* Banner Superior con color de marca */}
        <div 
          className="h-24 p-6 flex items-center justify-between"
          style={{ backgroundColor: 'var(--color-primary, #163020)' }}
        >
          <div className="flex flex-col justify-end h-full">
            <h3 className="text-white font-bold text-lg leading-tight truncate max-w-[180px]">
              {settings?.event_info?.event_name || 'Evento Universitario'}
            </h3>
            <p className="text-white/80 text-xs">Ticket de Acceso</p>
          </div>
          {settings?.branding?.logo_url && (
            <img 
              src={settings.branding.logo_url} 
              className="h-12 w-12 object-contain brightness-0 invert opacity-90" 
              alt="Logo"
            />
          )}
        </div>

        {/* Cuerpo del Ticket */}
        <div className="p-6 pt-8 flex flex-col items-center text-center">
          <div className="mb-6 p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <QRCodeSVG 
              value={JSON.stringify({ 
                uid: participant.auth_id, 
                sid: session.id,
                t: Date.now() 
              })}
              size={180}
              fgColor={primaryColor}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="space-y-1 mb-6">
            <h4 className="font-bold text-gray-900 text-xl">{participant.nombre} {participant.apellidos}</h4>
            <p className="text-gray-500 text-sm font-medium">{participant.matricula}</p>
          </div>

          <div className="w-full border-t-2 border-dashed border-gray-200 my-4 relative">
            {/* Círculos laterales de corte de ticket */}
            <div className="absolute -left-9 -top-3 w-6 h-6 rounded-full bg-gray-100 shadow-inner"></div>
            <div className="absolute -right-9 -top-3 w-6 h-6 rounded-full bg-gray-100 shadow-inner"></div>
          </div>

          <div className="w-full text-left space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Actividad</p>
              <p className="text-sm font-semibold text-gray-800 line-clamp-2">{session.titulo}</p>
            </div>
            <div className="flex justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Ubicación</p>
                <p className="text-xs font-semibold text-gray-800">{session.escenario?.nombre || 'Por confirmar'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Fecha</p>
                <p className="text-xs font-semibold text-gray-800">{session.fecha}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer del Ticket */}
        <div className="bg-gray-50 p-4 text-center">
          <p className="text-[10px] text-gray-500 font-bold mb-1">
            INSTRUCCIONES:
          </p>
          <p className="text-[10px] text-gray-400 font-medium italic leading-tight">
            {settings?.comms?.ticket_instructions || 'Presenta este QR en la entrada del recinto.'}
          </p>
        </div>
      </div>

      {/* Botón de Acción - Estilo dinámico */}
      <button
        onClick={downloadTicket}
        className="w-full max-w-[320px] py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        Descargar Ticket Digital
      </button>
    </div>
  );
};

export default QRTicket;

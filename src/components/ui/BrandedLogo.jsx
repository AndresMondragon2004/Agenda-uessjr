import React from 'react';
import { useSettings } from '../../context/SettingsContext';
import { GraduationCap } from 'lucide-react';

/**
 * BrandedLogo: Componente universal para renderizar el logo de la plataforma.
 * Maneja automáticamente:
 * 1. Logo principal claro vs. oscuro.
 * 2. Fallback a logos institucionales por defecto.
 * 3. Fallback a texto si no hay imágenes.
 */
export default function BrandedLogo({ 
  className = '', 
  imgClassName = 'h-10 w-auto object-contain',
  showText = true,
  isDarkTheme = false 
}) {
  const { settings } = useSettings();
  
  const eventName = settings?.event_info?.event_name || 'Agenda';
  const institution = settings?.event_info?.institution || 'UESSJR';
  
  // Logos de la marca (cargados vía Customizer)
  const logoLight = settings?.branding?.logo_url_light || settings?.branding?.logo_url; 
  const logoDark = settings?.branding?.logo_url_dark || logoLight;
  
  // Logos institucionales (fallback dual)
  const logoInstitucional = settings?.branding?.logo_institucional_url;

  const currentLogo = isDarkTheme ? logoDark : logoLight;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Caso 1: Hay un logo principal configurado */}
      {currentLogo ? (
        <div className="flex items-center gap-3">
          <img 
            src={currentLogo} 
            alt={eventName} 
            className={`${imgClassName} transition-transform hover:scale-105`} 
          />
          {logoInstitucional && (
             <>
               <div className="h-6 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />
               <img 
                 src={logoInstitucional} 
                 alt="Institucional" 
                 className={`${imgClassName} transition-transform hover:scale-105 hidden sm:block opacity-80`} 
               />
             </>
          )}
        </div>
      ) : (
        /* Caso 2: No hay logo principal, usamos fallbacks */
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-global bg-primary flex items-center justify-center shadow-sm">
            <GraduationCap className="w-5 h-5 text-secondary" />
          </div>
          {/* Default UMB/UES logos if no custom logos exist */}
          {!logoInstitucional && (
            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700">
              <img src="https://sic.cultura.gob.mx/imagenes_cache/universidad_4260_g_74199.png" alt="UMB" className="h-7 object-contain opacity-80 dark:brightness-0 dark:invert" />
              <img src="/images/logos/ues-sjr.png" alt="UES SJR" className="h-7 object-contain opacity-80 dark:brightness-0 dark:invert" />
            </div>
          )}
        </div>
      )}

      {/* Texto al lado del logo (Opcional) */}
      {showText && !currentLogo && (
        <div className="flex flex-col leading-none ml-1">
          <span className="font-extrabold text-base text-gray-900 dark:text-white tracking-tight">
            {institution}
          </span>
          <span className="font-medium text-[10px] text-gray-500 dark:text-gray-400 tracking-widest uppercase -mt-0.5">
            {eventName}
          </span>
        </div>
      )}
    </div>
  );
}

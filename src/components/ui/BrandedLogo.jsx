import React from 'react';
import { useSettings } from '../../context/SettingsContext';
import { GraduationCap } from 'lucide-react';

/**
 * BrandedLogo: Componente universal para renderizar el logo de la plataforma.
 */
export default function BrandedLogo({ 
  className = '', 
  imgClassName = 'h-10 w-auto object-contain',
  showText = true,
  isDarkTheme = false,
  hideInstitutional = false,
  onlyInstitutional = false
}) {
  const { settings } = useSettings();
  
  const eventName = settings?.event_info?.event_name || 'Agenda';
  const institution = settings?.event_info?.institution || 'UESSJR';
  
  // Logos de la marca
  const logoLight = settings?.branding?.logo_url_light || settings?.branding?.logo_url; 
  const logoDark = settings?.branding?.logo_url_dark || logoLight;
  const logoInstitucional = settings?.branding?.logo_institucional_url;

  const currentLogo = isDarkTheme ? logoDark : logoLight;

  return (
    <div className={`flex items-center ${onlyInstitutional ? 'gap-0' : 'gap-6'} ${className}`}>
      {/* ─── PARTE 1: IDENTIDAD DE LA MARCA ─── */}
      {!onlyInstitutional && (
        <div className="flex items-center gap-3">
          {currentLogo ? (
            <img 
              src={currentLogo} 
              alt={eventName} 
              className={`${imgClassName} transition-transform hover:scale-105`} 
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <GraduationCap className="w-5 h-5 text-secondary" />
            </div>
          )}

          {showText && (
            <div className="flex flex-col leading-none ml-0.5">
              <span className={`font-extrabold text-base tracking-tight ${isDarkTheme ? 'text-white' : 'text-gray-900 dark:text-emerald-400'}`}>
                {institution}
              </span>
              <span className={`font-medium text-[10px] tracking-widest uppercase -mt-0.5 ${isDarkTheme ? 'text-emerald-400/80' : 'text-gray-400 dark:text-emerald-700'}`}>
                AGENDA
              </span>
            </div>
          )}
        </div>
      )}

      {/* ─── PARTE 2: LOGOS INSTITUCIONALES ─── */}
      {!hideInstitutional && (
        <div className={`${onlyInstitutional ? '' : 'hidden sm:flex items-center gap-4 pl-6 border-l border-gray-100 dark:border-emerald-900/30'}`}>
          <div className="flex items-center gap-4">
            {logoInstitucional ? (
              <img 
                src={logoInstitucional} 
                alt="Institucional" 
                className={`h-8 w-auto object-contain transition-all ${isDarkTheme ? 'brightness-0 invert opacity-100' : 'opacity-80'}`} 
              />
            ) : (
              <>
                <img 
                  src="https://sic.cultura.gob.mx/imagenes_cache/universidad_4260_g_74199.png" 
                  alt="UMB" 
                  className={`h-8 object-contain transition-all ${isDarkTheme ? 'brightness-0 invert opacity-100' : 'opacity-90'}`} 
                />
                <img 
                  src="/images/logos/ues-sjr.png" 
                  alt="UES SJR" 
                  className={`h-8 object-contain transition-all ${isDarkTheme ? 'brightness-0 invert opacity-100' : 'opacity-80'}`} 
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

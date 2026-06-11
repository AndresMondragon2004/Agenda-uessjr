import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

export const SettingsContext = createContext(null);

/**
 * SettingsProvider: Gestiona la configuración global de Marca Blanca.
 * Este contexto es el "corazón" visual de la plataforma, cargando colores,
 * logos y flags de funcionalidades dinámicamente desde Supabase.
 */
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Carga la configuración inicial desde la tabla singleton 'system_settings'.
   */
  const fetchSettings = useCallback(async () => {
    try {
      setIsLoadingSettings(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (err) {
      console.error('Error loading system settings:', err);
      setError(err.message);
    } finally {
      setIsLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    if (settings?.branding) {
      const { 
        primary_color, 
        secondary_color,
        bg_color_light,
        bg_color_dark,
        border_radius
      } = settings.branding;
      
      const root = document.documentElement;
      
      if (primary_color) root.style.setProperty('--color-primary', primary_color);
      if (secondary_color) root.style.setProperty('--color-secondary', secondary_color);
      if (bg_color_light) root.style.setProperty('--color-bg-light', bg_color_light);
      if (bg_color_dark) root.style.setProperty('--color-bg-dark', bg_color_dark);
      if (border_radius) root.style.setProperty('--border-radius-global', border_radius);

      // Inyectar anulaciones globales para clases CSS de Tailwind con colores hardcodeados
      let styleEl = document.getElementById('brand-override-styles');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'brand-override-styles';
        document.head.appendChild(styleEl);
      }
      
      styleEl.innerHTML = `
        :root {
          --color-primary: ${primary_color || '#163020'};
          --color-secondary: ${secondary_color || '#D97706'};
        }
        
        /* Reemplazar color primario hardcodeado (#163020) */
        .bg-\\[\\#163020\\] { background-color: var(--color-primary) !important; }
        .text-\\[\\#163020\\] { color: var(--color-primary) !important; }
        .border-\\[\\#163020\\] { border-color: var(--color-primary) !important; }
        .focus\\:border-\\[\\#163020\\]:focus { border-color: var(--color-primary) !important; }
        .hover\\:bg-\\[\\#163020\\]:hover { background-color: var(--color-primary) !important; }
        .hover\\:text-\\[\\#163020\\]:hover { color: var(--color-primary) !important; }
        .group-hover\\:text-\\[\\#163020\\] { color: var(--color-primary) !important; }
        .group-hover\\:bg-\\[\\#163020\\]:hover { background-color: var(--color-primary) !important; }
        
        /* Reemplazar color secundario hardcodeado (#D97706) */
        .bg-\\[\\#D97706\\] { background-color: var(--color-secondary) !important; }
        .text-\\[\\#D97706\\] { color: var(--color-secondary) !important; }
        .border-\\[\\#D97706\\] { border-color: var(--color-secondary) !important; }
        .focus\\:border-\\[\\#D97706\\]:focus { border-color: var(--color-secondary) !important; }
        .hover\\:bg-\\[\\#D97706\\]:hover { background-color: var(--color-secondary) !important; }
        .hover\\:text-\\[\\#D97706\\]:hover { color: var(--color-secondary) !important; }
        .group-hover\\:text-\\[\\#D97706\\] { color: var(--color-secondary) !important; }
        .group-hover\\:bg-\\[\\#D97706\\]:hover { background-color: var(--color-secondary) !important; }
        
        /* Reemplazar color de borde del QR y otros elementos primarios por defecto */
        .border-primary { border-color: var(--color-primary) !important; }
        .bg-primary { background-color: var(--color-primary) !important; }
        .text-primary { color: var(--color-primary) !important; }
      `;
    }
  }, [settings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /**
   * saveDraft: Guarda los cambios en la columna draft_settings sin publicarlos.
   */
  const saveDraft = async (draftData) => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .update({ draft_settings: draftData })
        .eq('id', 1)
        .select()
        .single();

      if (error) throw error;
      setSettings(data);
      return { success: true, data };
    } catch (err) {
      console.error('Error saving draft settings:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * publishSettings: Mueve la configuración del borrador a la oficial.
   */
  const publishSettings = async (finalSettings) => {
    try {
      // Al publicar, el draft_settings se limpia o se iguala
      const { data, error } = await supabase
        .from('system_settings')
        .update({
          branding: finalSettings.branding,
          event_info: finalSettings.event_info,
          feature_flags: finalSettings.feature_flags,
          interaction: finalSettings.interaction,
          comms: finalSettings.comms,
          advanced_templates: finalSettings.advanced_templates,
          draft_settings: null // Limpiamos borrador al publicar
        })
        .eq('id', 1)
        .select()
        .single();

      if (error) throw error;
      setSettings(data);
      return { success: true, data };
    } catch (err) {
      console.error('Error publishing system settings:', err);
      return { success: false, error: err.message };
    }
  };

  const value = {
    settings,
    isLoadingSettings,
    error,
    saveDraft,
    publishSettings,
    updateSettings: publishSettings, // Alias para compatibilidad
    refreshSettings: fetchSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * Hook personalizado para acceder a la configuración desde cualquier componente.
 * Útil para aplicar estilos dinámicos o verificar feature flags.
 */
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings debe usarse dentro de un SettingsProvider');
  }
  return context;
};

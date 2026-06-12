import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

export const SettingsContext = createContext(null);

/**
 * SettingsProvider: Gestiona la configuración global de Marca Blanca.
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

  /**
   * Sincronización de estilos dinámica — inyecta CSS variables desde branding y tipografía.
   */
  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    const b = settings.branding || {};
    if (b.primary_color)   root.style.setProperty('--color-primary',       b.primary_color);
    if (b.secondary_color) root.style.setProperty('--color-secondary',     b.secondary_color);
    if (b.bg_color_light)  root.style.setProperty('--color-bg-light',      b.bg_color_light);
    if (b.bg_color_dark)   root.style.setProperty('--color-bg-dark',       b.bg_color_dark);
    if (b.border_radius)   root.style.setProperty('--border-radius-global', b.border_radius);
    // Tipografía dinámica
    if (settings.typography?.font_family) {
      const fontName = settings.typography.font_family;
      // Cargar fuente de Google Fonts si no es la fuente por defecto
      if (fontName !== 'Plus Jakarta Sans' && fontName !== 'system-ui') {
        const linkId = 'dynamic-font-link';
        let link = document.getElementById(linkId);
        if (!link) {
          link = document.createElement('link');
          link.id = linkId;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700;800&display=swap`;
        root.style.setProperty('--font-primary', `'${fontName}', sans-serif`);
      }
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
      const { data, error } = await supabase
        .from('system_settings')
        .update({
          branding: finalSettings.branding,
          event_info: finalSettings.event_info,
          feature_flags: finalSettings.feature_flags,
          interaction: finalSettings.interaction,
          comms: finalSettings.comms,
          // social: finalSettings.social, // Column does not exist
          // typography: finalSettings.typography, // Column does not exist
          // advanced_templates: finalSettings.advanced_templates, // Column does not exist
          draft_settings: null
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
    updateSettings: publishSettings,
    refreshSettings: fetchSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings debe usarse dentro de un SettingsProvider');
  }
  return context;
};

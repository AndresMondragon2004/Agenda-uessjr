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
   * Sincronización de estilos dinámica (DESHABILITADA TEMPORALMENTE)
   * Se comenta este bloque para evitar conflictos con los estilos estáticos refinados.
   */
  useEffect(() => {
    // La lógica de inyección de CSS dinámico ha sido removida temporalmente
    // para asegurar la estabilidad del nuevo diseño del Navbar.
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
          advanced_templates: finalSettings.advanced_templates,
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

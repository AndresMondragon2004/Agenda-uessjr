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
   * Se ejecuta al inicio de la aplicación para asegurar que el branding esté disponible.
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
      const { primary_color, secondary_color } = settings.branding;
      if (primary_color) {
        document.documentElement.style.setProperty('--color-primary', primary_color);
      }
      if (secondary_color) {
        document.documentElement.style.setProperty('--color-secondary', secondary_color);
      }
    }
  }, [settings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /**
   * updateSettings: Permite al administrador guardar cambios en tiempo real.
   * @param {Object} newSettings - Objeto con las claves branding, event_info, feature_flags o advanced_templates.
   * 
   * Nota Arquitectónica: Al usar JSONB, podemos actualizar solo una parte del objeto 
   * (ej. solo branding) y Supabase manejará la persistencia de forma eficiente.
   */
  const updateSettings = async (newSettings) => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .update(newSettings)
        .eq('id', 1)
        .select()
        .single();

      if (error) throw error;
      setSettings(data);
      return { success: true, data };
    } catch (err) {
      console.error('Error updating system settings:', err);
      return { success: false, error: err.message };
    }
  };

  const value = {
    settings,
    isLoadingSettings,
    error,
    updateSettings,
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

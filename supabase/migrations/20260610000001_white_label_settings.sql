-- Phase 1: White-label SaaS Core Configuration
-- Archivo: supabase/migrations/20260610000001_white_label_settings.sql

-- Tabla de configuración del sistema (Singleton)
-- Esta tabla almacena toda la personalización global de la plataforma.
CREATE TABLE IF NOT EXISTS public.system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    branding JSONB DEFAULT '{
        "primary_color": "#2563eb", 
        "secondary_color": "#7c3aed", 
        "logo_url": null, 
        "favicon_url": null,
        "background_image": null
    }'::jsonb,
    event_info JSONB DEFAULT '{
        "event_name": "Agenda Universitaria", 
        "institution": "UESSJR",
        "contact_email": "soporte@example.com",
        "start_date": null,
        "end_date": null
    }'::jsonb,
    feature_flags JSONB DEFAULT '{
        "modulo_reacciones": true, 
        "mostrar_ponentes": true, 
        "generador_constancias": false,
        "chat_soporte": false
    }'::jsonb,
    advanced_templates JSONB DEFAULT '{
        "certificate_coords": {"x": 100, "y": 200},
        "email_welcome_template": "Hola {{name}}, bienvenido a {{event_name}}."
    }'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Garantizamos que solo exista una fila en toda la tabla (Patrón Singleton)
    CONSTRAINT singleton_check CHECK (id = 1)
);

-- Comentario sobre el uso de JSONB:
-- El uso de JSONB es una decisión arquitectónica clave para el modelo SaaS Marca Blanca.
-- Nos ahorra crear decenas de columnas individuales (primary_color, secondary_color, etc.)
-- permitiendo que la plataforma evolucione sin necesidad de migraciones de base de datos constantes.
-- Si mañana decidimos añadir una nueva característica configurable, simplemente añadimos 
-- una nueva propiedad al objeto JSON correspondiente desde el frontend Admin.

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Política: Lectura pública (Cualquier usuario o visitante necesita ver los colores y logos)
CREATE POLICY "Configuración legible por todos" 
ON public.system_settings FOR SELECT 
USING (true);

-- Política: Solo administradores activos pueden actualizar la configuración
CREATE POLICY "Solo admins pueden actualizar la configuración" 
ON public.system_settings FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE auth_id = auth.uid() AND activo = true
  )
);

-- Insertar la fila inicial de configuración
INSERT INTO public.system_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Trigger para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_system_settings_updated_at') THEN
        CREATE TRIGGER update_system_settings_updated_at
            BEFORE UPDATE ON public.system_settings
            FOR EACH ROW
            EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;

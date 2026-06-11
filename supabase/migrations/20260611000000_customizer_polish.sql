-- Migration: Update system_settings for Drafts and Dual Branding
-- Archivo: supabase/migrations/20260611000000_customizer_polish.sql

-- 1. Añadir columna draft_settings para el sistema de borradores
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS draft_settings JSONB DEFAULT NULL;

-- 2. Actualizar el esquema de branding para soportar logo dual si es necesario
-- (Aunque JSONB es flexible, podemos inicializar los valores si queremos)
-- En este caso, simplemente nos aseguraremos de que el frontend maneje las nuevas claves:
-- logo_institucional_url y logo_local_url

COMMENT ON COLUMN public.system_settings.draft_settings IS 'Almacena cambios no publicados del personalizador Marca Blanca.';

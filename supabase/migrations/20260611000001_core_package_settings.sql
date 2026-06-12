-- Migration: Update system_settings for Core Package
-- Archivo: supabase/migrations/20260611000001_core_package_settings.sql

-- Actualizamos el valor por defecto de branding para incluir el paquete core
UPDATE public.system_settings 
SET branding = '{
    "primary_color": "#163020", 
    "secondary_color": "#e0a96d", 
    "bg_color_light": "#FAF9F6",
    "bg_color_dark": "#05140B",
    "border_radius": "0.5rem",
    "logo_url_light": null, 
    "logo_url_dark": null, 
    "favicon_url": null,
    "background_image_hero": null,
    "background_image_login": null
}'::jsonb
WHERE id = 1;

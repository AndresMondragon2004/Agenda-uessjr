-- Reset: Restore Institutional Identity
-- Archivo: supabase/migrations/20260611000002_reset_original_colors.sql

UPDATE public.system_settings 
SET branding = '{
    "primary_color": "#163020", 
    "secondary_color": "#e0a96d", 
    "bg_color_light": "#FAF9F6",
    "bg_color_dark": "#05140B",
    "border_radius": "0.5rem",
    "logo_url_light": null, 
    "logo_url_dark": null, 
    "logo_institucional_url": null,
    "reports_logo_url": null,
    "favicon_url": null,
    "background_image_hero": null,
    "background_image_login": null
}'::jsonb,
draft_settings = NULL
WHERE id = 1;

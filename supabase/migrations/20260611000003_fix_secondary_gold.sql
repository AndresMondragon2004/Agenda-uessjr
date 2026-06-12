-- Fix: Update secondary color to correct amber/gold
-- Archivo: supabase/migrations/20260611000003_fix_secondary_gold.sql

UPDATE public.system_settings 
SET branding = branding || '{"secondary_color": "#D97706"}'::jsonb
WHERE id = 1;

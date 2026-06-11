-- Migration: Add missing columns to system_settings for white-label branding
-- Archivo: supabase/migrations/20260610000002_add_interaction_comms_draft.sql

ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS interaction JSONB DEFAULT '{
    "reaction_pack": ["👏", "🔥", "❤️", "💡", "🚀", "💯", "🤔", "🙌"],
    "survey_q1": null,
    "survey_q2": null
}'::jsonb,
ADD COLUMN IF NOT EXISTS comms JSONB DEFAULT '{
    "ticket_instructions": null,
    "email_welcome_subject": null,
    "email_welcome_body": null
}'::jsonb,
ADD COLUMN IF NOT EXISTS draft_settings JSONB DEFAULT NULL;

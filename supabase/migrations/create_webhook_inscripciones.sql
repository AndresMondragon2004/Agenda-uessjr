-- Asegurar que la extensión para hacer peticiones HTTP esté activa
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. Crear la función que arma el payload y usa net.http_post
CREATE OR REPLACE FUNCTION trigger_notify_inscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://[TU_PROYECTO_REF].supabase.co/functions/v1/notify-inscription',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(NEW),
      'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE null END
    )
  );
  RETURN NEW;
END;
$$;

-- 2. Borrar el trigger si existe
DROP TRIGGER IF EXISTS on_inscripcion_created_or_updated ON inscripciones;

-- 3. Crear el trigger que llama a nuestra función
CREATE TRIGGER on_inscripcion_created_or_updated
AFTER INSERT OR UPDATE ON inscripciones
FOR EACH ROW EXECUTE FUNCTION trigger_notify_inscription();

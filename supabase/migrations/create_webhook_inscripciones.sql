-- Asegurar que la extensión para hacer peticiones HTTP esté activa
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. Crear la función que arma el payload de forma blindada
CREATE OR REPLACE FUNCTION trigger_notify_inscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_rec jsonb := null;
BEGIN
  -- Evitamos evaluar OLD si es un INSERT
  IF TG_OP = 'UPDATE' THEN
    old_rec := to_jsonb(OLD);
  END IF;

  -- Usamos jsonb_build_object nativo para TODO, así evitamos cualquier error
  -- de sintaxis "invalid input syntax for type json" por saltos de línea invisibles.
  PERFORM net.http_post(
    url := 'https://ydcybysimlvatvadpbaz.supabase.co/functions/v1/notify-inscription',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY3lieXNpbWx2YXR2YWRwYmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTU3MDAsImV4cCI6MjA5Mjg5MTcwMH0.IkwXKJkmJiArWyOToTURtAS1RpmcDCHa7cgF2gYX-PY'
    ),
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', to_jsonb(NEW),
      'old_record', old_rec
    )
  );
  
  RETURN NEW;
END;
$$;

-- 2. Borrar el trigger viejo si existe
DROP TRIGGER IF EXISTS on_inscripcion_created_or_updated ON inscripciones;

-- 3. Crear el trigger
CREATE TRIGGER on_inscripcion_created_or_updated
AFTER INSERT OR UPDATE ON inscripciones
FOR EACH ROW EXECUTE FUNCTION trigger_notify_inscription();

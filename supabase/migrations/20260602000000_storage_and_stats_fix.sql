-- 1. Create a storage bucket for materials if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('materiales', 'materiales', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policies for materials bucket
CREATE POLICY "Archivos de materiales son públicos"
ON storage.objects FOR SELECT
USING (bucket_id = 'materiales');

CREATE POLICY "Cualquiera puede subir materiales (MVP simple)"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'materiales');

-- 3. Refine the RPC to handle empty stats and ensure consistent types
DROP FUNCTION IF EXISTS get_sesion_by_ponente_token(UUID);

CREATE OR REPLACE FUNCTION get_sesion_by_ponente_token(p_token UUID)
RETURNS TABLE (
    id UUID,
    nombre TEXT,
    descripcion TEXT,
    hora_inicio TIME,
    hora_fin TIME,
    ponente_nombre TEXT,
    total_inscritos INT,
    tipo TEXT,
    fecha_jornada DATE,
    rating_avg FLOAT,
    rating_count INT,
    material_url TEXT,
    material_nombre TEXT,
    stats_carreras JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id::UUID, 
        s.nombre::TEXT, 
        s.descripcion::TEXT, 
        s.hora_inicio::TIME, 
        s.hora_fin::TIME, 
        s.ponente_nombre::TEXT,
        (SELECT COUNT(*)::INT FROM inscripciones i WHERE i.sesion_id = s.id AND i.estado = 'confirmada')::INT as total_inscritos,
        s.tipo::TEXT,
        d.fecha::DATE as fecha_jornada,
        COALESCE((SELECT AVG(calificacion)::FLOAT FROM feedback_sesiones f WHERE f.sesion_id = s.id), 0)::FLOAT as rating_avg,
        (SELECT COUNT(*)::INT FROM feedback_sesiones f WHERE f.sesion_id = s.id)::INT as rating_count,
        s.material_url::TEXT,
        s.material_nombre::TEXT,
        COALESCE(
            (
                SELECT jsonb_object_agg(programa_academico, count)
                FROM (
                    SELECT e.programa_academico, COUNT(*)::INT as count
                    FROM inscripciones i
                    JOIN estudiantes e ON i.estudiante_id = e.id
                    WHERE i.sesion_id = s.id AND i.estado = 'confirmada'
                    GROUP BY e.programa_academico
                ) sub
            ),
            '{}'::JSONB
        ) as stats_carreras
    FROM sesiones s
    LEFT JOIN dias_jornada d ON s.dia_jornada_id = d.id
    WHERE s.acceso_ponente_token = p_token
    LIMIT 1;
END;
$$;

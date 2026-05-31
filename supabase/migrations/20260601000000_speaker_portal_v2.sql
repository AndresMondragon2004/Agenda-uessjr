-- 1. Ensure feedback table exists with comments and ratings
CREATE TABLE IF NOT EXISTS public.feedback_sesiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sesion_id UUID REFERENCES public.sesiones(id) ON DELETE CASCADE,
    estudiante_id UUID REFERENCES public.estudiantes(id) ON DELETE CASCADE,
    calificacion INT NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
    comentario TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(sesion_id, estudiante_id)
);

-- 2. Add columns for support materials in sessions
ALTER TABLE public.sesiones
ADD COLUMN IF NOT EXISTS material_url TEXT,
ADD COLUMN IF NOT EXISTS material_nombre TEXT;

-- 3. Update the secure RPC to include stats and materials
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
        (SELECT AVG(calificacion)::FLOAT FROM feedback_sesiones f WHERE f.sesion_id = s.id) as rating_avg,
        (SELECT COUNT(*)::INT FROM feedback_sesiones f WHERE f.sesion_id = s.id) as rating_count,
        s.material_url::TEXT,
        s.material_nombre::TEXT,
        (
            SELECT jsonb_object_agg(programa_academico, count)
            FROM (
                SELECT e.programa_academico, COUNT(*)::INT as count
                FROM inscripciones i
                JOIN estudiantes e ON i.estudiante_id = e.id
                WHERE i.sesion_id = s.id AND i.estado = 'confirmada'
                GROUP BY e.programa_academico
            ) sub
        ) as stats_carreras
    FROM sesiones s
    LEFT JOIN dias_jornada d ON s.dia_jornada_id = d.id
    WHERE s.acceso_ponente_token = p_token
    LIMIT 1;
END;
$$;

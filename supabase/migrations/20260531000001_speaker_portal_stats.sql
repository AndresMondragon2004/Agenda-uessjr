-- 2. Borramos la función vieja para evitar conflictos de tipo
DROP FUNCTION IF EXISTS get_sesion_by_ponente_token(UUID);

-- 3. Creamos la función final con casts explícitos
CREATE OR REPLACE FUNCTION get_sesion_by_ponente_token(p_token UUID)
RETURNS TABLE (
    id UUID,
    nombre TEXT,
    descripcion TEXT,
    hora_inicio TIME,
    hora_fin TIME,
    ponente_nombre TEXT,
    tipo TEXT,
    material_url TEXT,
    material_nombre TEXT,
    fecha_jornada DATE,
    total_inscritos INT,
    stats_carreras JSON,
    rating_avg NUMERIC,
    rating_count INT
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
        s.tipo::TEXT, 
        s.material_url::TEXT, 
        s.material_nombre::TEXT,
        d.fecha::DATE as fecha_jornada,
        (SELECT COUNT(*)::INT FROM inscripciones i WHERE i.sesion_id = s.id AND i.estado = 'confirmada') as total_inscritos,
        (
            SELECT COALESCE(json_object_agg(programa, count), '{}'::json)
            FROM (
                SELECT e.programa_academico as programa, COUNT(*) as count
                FROM inscripciones i
                JOIN estudiantes e ON i.estudiante_id = e.id
                WHERE i.sesion_id = s.id AND i.estado = 'confirmada'
                GROUP BY e.programa_academico
            ) sub
        )::JSON as stats_carreras,
        (SELECT COALESCE(AVG(estrellas), 0)::NUMERIC FROM valoraciones v WHERE v.sesion_id = s.id) as rating_avg,
        (SELECT COUNT(*)::INT FROM valoraciones v WHERE v.sesion_id = s.id) as rating_count
    FROM sesiones s
    LEFT JOIN dias_jornada d ON s.dia_jornada_id = d.id
    WHERE s.acceso_ponente_token = p_token
    LIMIT 1;
END;
$$;

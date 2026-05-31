-- Migration to add Speaker Portal features

-- 1. Add access token to sesiones
ALTER TABLE public.sesiones
ADD COLUMN acceso_ponente_token UUID DEFAULT gen_random_uuid() UNIQUE;

-- Hide token from public select if necessary?
-- Not strictly possible to hide one column via standard RLS easily without a view, 
-- but we can assume the RPC will be used.

-- 2. Create Live Q&A table
CREATE TABLE public.sesion_preguntas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sesion_id UUID REFERENCES public.sesiones(id) ON DELETE CASCADE,
    estudiante_id UUID REFERENCES public.estudiantes(id) ON DELETE CASCADE,
    pregunta TEXT NOT NULL,
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'respondida', 'rechazada')),
    votos INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.sesion_preguntas ENABLE ROW LEVEL SECURITY;

-- Policies for Live Q&A
CREATE POLICY "Preguntas visibles para todos"
    ON public.sesion_preguntas FOR SELECT
    USING (true);

CREATE POLICY "Estudiantes pueden crear preguntas"
    ON public.sesion_preguntas FOR INSERT
    WITH CHECK (auth.uid() = estudiante_id);

CREATE POLICY "Estudiantes pueden actualizar sus preguntas"
    ON public.sesion_preguntas FOR UPDATE
    USING (auth.uid() = estudiante_id);

CREATE POLICY "Admins pueden todo en preguntas"
    ON public.sesion_preguntas FOR ALL
    USING (EXISTS (
      SELECT 1 FROM admins WHERE auth.uid() = id
    ));

-- Create a secure RPC for fetching session by token
-- We drop it first to ensure the return signature is correctly updated
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
    fecha_jornada DATE
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
        d.fecha::DATE as fecha_jornada
    FROM sesiones s
    LEFT JOIN dias_jornada d ON s.dia_jornada_id = d.id
    WHERE s.acceso_ponente_token = p_token
    LIMIT 1;
END;
$$;

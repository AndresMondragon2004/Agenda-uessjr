-- Tabla para Networking (Bolsa de Trabajo)
CREATE TABLE public.sesion_networking (
    sesion_id UUID REFERENCES public.sesiones(id) ON DELETE CASCADE,
    estudiante_id UUID REFERENCES public.estudiantes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (sesion_id, estudiante_id)
);

ALTER TABLE public.sesion_networking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Estudiantes pueden compartir su perfil"
    ON public.sesion_networking FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM estudiantes e
            WHERE e.id = sesion_networking.estudiante_id AND e.auth_id = auth.uid()
        )
    );

CREATE POLICY "Admins pueden ver networking"
    ON public.sesion_networking FOR SELECT
    USING (true); -- Hacerlo público para lectura simplifica el acceso por el token del ponente (que no tiene auth)

-- Tabla para Encuestas en Vivo (Live Polls)
CREATE TABLE public.sesion_encuestas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sesion_id UUID REFERENCES public.sesiones(id) ON DELETE CASCADE,
    pregunta TEXT NOT NULL,
    opciones JSONB NOT NULL DEFAULT '[]'::jsonb, -- formato: [{"texto": "A", "votos": 0}, {"texto": "B", "votos": 0}]
    estado TEXT DEFAULT 'activa' CHECK (estado IN ('activa', 'cerrada')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sesion_encuestas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Encuestas lectura publica" ON public.sesion_encuestas FOR SELECT USING (true);
CREATE POLICY "Encuestas insercion libre" ON public.sesion_encuestas FOR ALL USING (true); -- Para simplificar el control del ponente

-- Tabla de registro de votos de encuestas para evitar doble voto
CREATE TABLE public.sesion_encuesta_votos (
    encuesta_id UUID REFERENCES public.sesion_encuestas(id) ON DELETE CASCADE,
    estudiante_id UUID REFERENCES public.estudiantes(id) ON DELETE CASCADE,
    PRIMARY KEY (encuesta_id, estudiante_id)
);

ALTER TABLE public.sesion_encuesta_votos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Registro de votos estudiantes"
    ON public.sesion_encuesta_votos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM estudiantes e
            WHERE e.id = sesion_encuesta_votos.estudiante_id AND e.auth_id = auth.uid()
        )
    );

-- RPC seguro para votar en encuesta
CREATE OR REPLACE FUNCTION votar_encuesta(p_encuesta_id UUID, p_estudiante_id UUID, p_opcion_index INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Registrar el voto (esto fallará si ya votó por la llave primaria)
    INSERT INTO public.sesion_encuesta_votos (encuesta_id, estudiante_id) VALUES (p_encuesta_id, p_estudiante_id);
    
    -- Actualizar el JSONB (sumar 1 al voto de la opción seleccionada)
    UPDATE public.sesion_encuestas
    SET opciones = jsonb_set(
        opciones, 
        ARRAY[(p_opcion_index)::text, 'votos'], 
        (COALESCE((opciones->p_opcion_index->>'votos')::int, 0) + 1)::text::jsonb
    )
    WHERE id = p_encuesta_id;
END;
$$;

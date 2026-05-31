-- Función para quitar el voto (dislike o revertir like)
CREATE OR REPLACE FUNCTION downvote_pregunta(p_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.sesion_preguntas
    -- Evitamos que los votos sean negativos (opcional, GREATEST(0, ...), o podemos dejar que bajen a negativo si los alumnos la odian mucho)
    -- Por seguridad y buena UX, limitaremos a 0 mínimo
    SET votos = GREATEST(0, votos - 1)
    WHERE id = p_id;
END;
$$;

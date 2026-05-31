-- Función para incrementar votos de una pregunta de forma segura
CREATE OR REPLACE FUNCTION upvote_pregunta(p_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.sesion_preguntas
    SET votos = votos + 1
    WHERE id = p_id;
END;
$$;

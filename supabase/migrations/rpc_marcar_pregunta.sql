-- RPC para que los ponentes puedan marcar preguntas como respondidas sin necesidad de login
CREATE OR REPLACE FUNCTION marcar_pregunta_respondida(p_pregunta_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.sesion_preguntas
    SET estado = 'respondida'
    WHERE id = p_pregunta_id;
END;
$$;

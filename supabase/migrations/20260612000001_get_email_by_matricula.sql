CREATE OR REPLACE FUNCTION public.get_email_by_matricula(p_matricula TEXT)
RETURNS TEXT AS $$
DECLARE
    v_email TEXT;
BEGIN
    SELECT correo INTO v_email 
    FROM public.estudiantes 
    WHERE matricula::TEXT = p_matricula::TEXT 
    LIMIT 1;
    
    RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_email_by_matricula(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION get_email_by_matricula(p_matricula TEXT)
RETURNS TEXT AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT correo INTO v_email FROM estudiantes WHERE matricula = p_matricula LIMIT 1;
  RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

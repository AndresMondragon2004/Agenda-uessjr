-- Table to store votes (likes/dislikes) for each session
CREATE TABLE IF NOT EXISTS votos_sesion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sesion_id UUID REFERENCES sesiones(id) ON DELETE CASCADE,
  estudiante_id UUID REFERENCES estudiantes(id) ON DELETE CASCADE,
  voto INTEGER NOT NULL, -- 1 for like, -1 for dislike
  UNIQUE(sesion_id, estudiante_id) -- One vote per student per session
);

-- Enable RLS
ALTER TABLE votos_sesion ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view vote counts" ON votos_sesion FOR SELECT USING (true);
CREATE POLICY "Estudiantes can vote" ON votos_sesion FOR INSERT WITH CHECK (auth.uid() IN (SELECT auth_id FROM estudiantes WHERE id = estudiante_id));
CREATE POLICY "Estudiantes can change their vote" ON votos_sesion FOR UPDATE USING (auth.uid() IN (SELECT auth_id FROM estudiantes WHERE id = estudiante_id));
CREATE POLICY "Estudiantes can remove their vote" ON votos_sesion FOR DELETE USING (auth.uid() IN (SELECT auth_id FROM estudiantes WHERE id = estudiante_id));

-- Function to get vote stats efficiently
CREATE OR REPLACE FUNCTION get_sesion_votes(ses_id UUID)
RETURNS TABLE (likes BIGINT, dislikes INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE voto = 1) as likes,
    COUNT(*) FILTER (WHERE voto = -1)::INTEGER as dislikes
  FROM votos_sesion
  WHERE sesion_id = ses_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

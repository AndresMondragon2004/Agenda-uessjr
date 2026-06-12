-- Create table for recent activity logging
CREATE TABLE IF NOT EXISTS actividad_reciente (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  entidad_tipo TEXT NOT NULL, -- e.g., 'jornada', 'estudiante', 'sesion'
  accion TEXT NOT NULL,       -- e.g., 'crear', 'modificar', 'eliminar'
  descripcion TEXT NOT NULL,  -- e.g., 'Admin X modificó el nombre de la jornada'
  detalles JSONB,             -- Store old and new values
  usuario_nombre TEXT         -- Name of the person who performed the action
);

-- Enable RLS
ALTER TABLE actividad_reciente ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view all activity" ON actividad_reciente
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.auth_id = auth.uid() AND admins.activo = true
    )
  );

CREATE POLICY "Allow service insertions" ON actividad_reciente
  FOR INSERT WITH CHECK (true);

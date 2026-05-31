-- Corrección de políticas de seguridad (RLS) para sesion_preguntas

-- Borrar políticas erróneas anteriores
DROP POLICY IF EXISTS "Estudiantes pueden crear preguntas" ON public.sesion_preguntas;
DROP POLICY IF EXISTS "Estudiantes pueden actualizar sus preguntas" ON public.sesion_preguntas;

-- Crear políticas correctas vinculando el auth.uid() con el auth_id de la tabla estudiantes
CREATE POLICY "Estudiantes pueden crear preguntas"
    ON public.sesion_preguntas FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM estudiantes e
            WHERE e.id = sesion_preguntas.estudiante_id AND e.auth_id = auth.uid()
        )
    );

CREATE POLICY "Estudiantes pueden actualizar sus preguntas"
    ON public.sesion_preguntas FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM estudiantes e
            WHERE e.id = sesion_preguntas.estudiante_id AND e.auth_id = auth.uid()
        )
    );

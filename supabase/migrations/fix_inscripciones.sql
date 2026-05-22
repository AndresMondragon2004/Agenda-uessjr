-- =========================================================================================
-- FIX: Inscripciones Concurrentes (Race Condition) y Colisiones de Horario
-- =========================================================================================

-- 1. Función para inscribir estudiante de manera atómica (evita race condition en cupos)
CREATE OR REPLACE FUNCTION inscribir_estudiante(p_estudiante_id UUID, p_sesion_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Se ejecuta con privilegios para poder leer/escribir independientemente de RLS si es necesario
AS $$
DECLARE
    v_inscripcion_id UUID;
    v_estado VARCHAR;
    v_cupo_maximo INT;
    v_inscritos_actuales INT;
    v_hi TIME;
    v_hf TIME;
    v_dia_id UUID;
    v_sesion_nombre VARCHAR;
    v_traslape_nombre VARCHAR;
BEGIN
    -- Verificar si ya está inscrito o en lista de espera
    IF EXISTS (
        SELECT 1 FROM inscripciones 
        WHERE estudiante_id = p_estudiante_id AND sesion_id = p_sesion_id
    ) THEN
        RAISE EXCEPTION 'Ya tienes un registro en esta sesión';
    END IF;

    -- Obtener datos de la sesión y escenario
    SELECT s.hora_inicio, s.hora_fin, s.dia_jornada_id, s.nombre, e.capacidad_maxima
    INTO v_hi, v_hf, v_dia_id, v_sesion_nombre, v_cupo_maximo
    FROM sesiones s
    LEFT JOIN escenarios e ON s.escenario_id = e.id
    WHERE s.id = p_sesion_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La sesión no existe';
    END IF;

    -- Bloquear temporalmente las filas de inscripciones de esta sesión para evitar que otro proceso lea el count al mismo tiempo
    -- Esto garantiza exactitud en el conteo de cupo.
    PERFORM 1 FROM sesiones WHERE id = p_sesion_id FOR UPDATE;

    -- Contar inscritos confirmados actuales
    SELECT COUNT(*) INTO v_inscritos_actuales
    FROM inscripciones
    WHERE sesion_id = p_sesion_id AND estado = 'confirmada';

    -- Determinar estado
    IF v_cupo_maximo IS NOT NULL AND v_inscritos_actuales >= v_cupo_maximo THEN
        v_estado := 'lista_espera';
    ELSE
        v_estado := 'confirmada';
    END IF;

    -- Si se va a confirmar, verificar traslapes con otras sesiones CONFIRMADAS del alumno
    IF v_estado = 'confirmada' THEN
        SELECT s.nombre INTO v_traslape_nombre
        FROM inscripciones i
        JOIN sesiones s ON i.sesion_id = s.id
        WHERE i.estudiante_id = p_estudiante_id
          AND i.estado = 'confirmada'
          AND s.dia_jornada_id = v_dia_id
          AND v_hi < s.hora_fin 
          AND v_hf > s.hora_inicio
        LIMIT 1;

        IF v_traslape_nombre IS NOT NULL THEN
            RAISE EXCEPTION 'Conflicto de horario: Ya tienes una sesión confirmada a esta hora ("%").', v_traslape_nombre;
        END IF;
    END IF;

    -- Insertar la inscripción
    INSERT INTO inscripciones (estudiante_id, sesion_id, estado)
    VALUES (p_estudiante_id, p_sesion_id, v_estado)
    RETURNING id INTO v_inscripcion_id;

    -- Retornar el resultado
    RETURN json_build_object(
        'id', v_inscripcion_id,
        'estado', v_estado
    );
END;
$$;


-- =========================================================================================
-- 2. Trigger para evitar colisiones de sesiones creadas por Admins en el mismo escenario
-- =========================================================================================

CREATE OR REPLACE FUNCTION check_sesion_overlap()
RETURNS TRIGGER AS $$
DECLARE
    v_conflicto_nombre VARCHAR;
BEGIN
    -- Validar que hora_inicio sea menor que hora_fin
    IF NEW.hora_inicio >= NEW.hora_fin THEN
        RAISE EXCEPTION 'La hora de inicio debe ser anterior a la hora de fin';
    END IF;

    -- Solo verificar si la sesión no está cancelada, tiene escenario y día
    IF NEW.estado != 'cancelada' AND NEW.escenario_id IS NOT NULL AND NEW.dia_jornada_id IS NOT NULL THEN
        SELECT nombre INTO v_conflicto_nombre
        FROM sesiones
        WHERE escenario_id = NEW.escenario_id
          AND dia_jornada_id = NEW.dia_jornada_id
          AND estado != 'cancelada'
          AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID) -- Excluir la misma sesión si es update
          AND NEW.hora_inicio < hora_fin 
          AND NEW.hora_fin > hora_inicio
        LIMIT 1;

        IF v_conflicto_nombre IS NOT NULL THEN
            RAISE EXCEPTION 'Error de colisión: El horario choca con la sesión "%" en este mismo escenario.', v_conflicto_nombre;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Borrar el trigger si ya existe para recrearlo
DROP TRIGGER IF EXISTS trigger_check_sesion_overlap ON sesiones;

-- Crear el trigger
CREATE TRIGGER trigger_check_sesion_overlap
BEFORE INSERT OR UPDATE ON sesiones
FOR EACH ROW
EXECUTE FUNCTION check_sesion_overlap();

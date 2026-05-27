import { supabase } from './supabase'

export const inscripcionesService = {

  async getBySesion(sesionId) {
    const { data, error } = await supabase
      .from('inscripciones')
      .select(`
        id, estado, created_at, estudiante_id,
        estudiantes(nombre, apellidos, matricula, correo, programa_academico)
      `)
      .eq('sesion_id', sesionId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  },

  async getByEstudiante(estudianteId) {
    const { data, error } = await supabase
      .from('inscripciones')
      .select(`
        id,
        estado,
        created_at,
        sesiones (
          id, nombre, tipo, hora_inicio, hora_fin,
          ponente_nombre, ponente_grado,
          escenarios ( nombre ),
          dias_jornada ( fecha, nombre_dia )
        )
      `)
      .eq('estudiante_id', estudianteId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async inscribir(estudianteId, sesionId) {
    // Llamar a la función segura en base de datos (RPC) que maneja transacciones y evita race conditions
    const { data: result, error: rpcError } = await supabase.rpc('inscribir_estudiante', {
      p_estudiante_id: estudianteId,
      p_sesion_id: sesionId
    });

    if (rpcError) {
      throw new Error(rpcError.message || 'Error al procesar la inscripción');
    }

    // El RPC retorna el id y el estado final
    const estado = result.estado;
    const inscripcionId = result.id;

    return { id: inscripcionId, estado, sesion_id: sesionId, estudiante_id: estudianteId };
  },


  async cancelar(estudianteId, sesionId) {
    // 1. Obtener detalles de la inscripción antes de borrarla
    const { data: currentInsc } = await supabase
      .from('inscripciones')
      .select('id, estado, sesion_id')
      .eq('estudiante_id', estudianteId)
      .eq('sesion_id', sesionId)
      .maybeSingle()

    // 2. Borrar
    const { error } = await supabase
      .from('inscripciones')
      .delete()
      .eq('estudiante_id', estudianteId)
      .eq('sesion_id', sesionId)
    if (error) throw error

    // 3. Procesar lista de espera si la inscripción cancelada era confirmada
    if (currentInsc && currentInsc.estado === 'confirmada') {
      await this.procesarListaEspera(currentInsc.sesion_id)
    }
  },

  async cancelarPorId(inscripcionId) {
    // 1. Obtener detalles
    const { data: currentInsc } = await supabase
      .from('inscripciones')
      .select('id, estado, sesion_id')
      .eq('id', inscripcionId)
      .maybeSingle()

    // 2. Borrar
    const { error } = await supabase
      .from('inscripciones')
      .delete()
      .eq('id', inscripcionId)
    if (error) throw error

    // 3. Procesar lista de espera si la inscripción cancelada era confirmada
    if (currentInsc && currentInsc.estado === 'confirmada') {
      await this.procesarListaEspera(currentInsc.sesion_id)
    }
  },

  async procesarListaEspera(sesionId) {
    try {
      // 1. Buscar la inscripción en lista de espera más antigua
      const { data: waitlisted, error: wErr } = await supabase
        .from('inscripciones')
        .select('*')
        .eq('sesion_id', sesionId)
        .eq('estado', 'lista_espera')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (wErr) throw wErr

      if (waitlisted) {
        // 2. Promover a confirmada
        const { error: uErr } = await supabase
          .from('inscripciones')
          .update({ estado: 'confirmada' })
          .eq('id', waitlisted.id)

        if (uErr) throw uErr
      }
    } catch (err) {
      console.error('Error al procesar la lista de espera:', err)
    }
  },

  async getTotalBySesion(sesionId) {
    const { count, error } = await supabase
      .from('inscripciones')
      .select('*', { count: 'exact', head: true })
      .eq('sesion_id', sesionId)
      .eq('estado', 'confirmada')
    if (error) throw error
    return count || 0
  },

  async getListaCompletaPorJornada(jornadaId) {
    const { data, error } = await supabase
      .from('inscripciones')
      .select(`
        id,
        estado,
        created_at,
        estudiantes(nombre, apellidos, matricula, correo, programa_academico),
        sesiones(
          nombre, tipo, hora_inicio, hora_fin,
          dias_jornada(fecha, nombre_dia),
          escenarios(nombre)
        )
      `)
      .eq('sesiones.jornada_id', jornadaId)
      .eq('estado', 'confirmada')
    if (error) throw error
    return data
  },
}

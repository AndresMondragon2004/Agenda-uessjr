import { supabase } from './supabase'
import { gasService } from './gas.service'
import { telegramService } from './telegram.service'

export const inscripcionesService = {

  async getBySesion(sesionId) {
    const { data, error } = await supabase
      .from('inscripciones')
      .select(`
        *,
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
    // 1. Verificar si ya está inscrito en ESTA sesión
    const { data: existing } = await supabase
      .from('inscripciones')
      .select('id')
      .eq('estudiante_id', estudianteId)
      .eq('sesion_id', sesionId)
      .maybeSingle()
    if (existing) throw new Error('Ya estás inscrito en esta sesión')

    // 2. Obtener datos de la sesión actual (horario y cupo)
    const { data: sesionActual, error: sErr } = await supabase
      .from('sesiones')
      .select('*, escenarios(capacidad_maxima), dias_jornada(fecha, nombre_dia)')
      .eq('id', sesionId)
      .single()
    
    if (sErr) throw sErr

    // 3. Verificar traslape de horarios
    const { data: misInscripciones } = await supabase
      .from('inscripciones')
      .select('sesiones(nombre, hora_inicio, hora_fin, dias_jornada(fecha))')
      .eq('estudiante_id', estudianteId)
    
    const tieneTraslape = (misInscripciones || []).find(i => {
      const s = i.sesiones
      if (!s || !s.dias_jornada || !sesionActual.dias_jornada) return false
      // Mismo día
      if (s.dias_jornada.fecha === sesionActual.dias_jornada.fecha) {
        // El nuevo inicia antes que termine uno existente Y termina después que inicie
        return sesionActual.hora_inicio < s.hora_fin && sesionActual.hora_fin > s.hora_inicio
      }
      return false
    })

    if (tieneTraslape) {
      throw new Error(`Conflicto de horario: Ya tienes una sesión inscrita a esta hora ("${tieneTraslape.sesiones.nombre}")`)
    }

    // 4. Verificar cupo
    const cupo = sesionActual?.escenarios?.capacidad_maxima
    if (cupo) {
      const { count } = await supabase
        .from('inscripciones')
        .select('*', { count: 'exact', head: true })
        .eq('sesion_id', sesionId)
        .eq('estado', 'confirmada')
      if (count >= cupo) throw new Error('Cupo lleno')
    }

    // 5. Insertar
    const { data, error } = await supabase
      .from('inscripciones')
      .insert([{ estudiante_id: estudianteId, sesion_id: sesionId, estado: 'confirmada' }])
      .select()
      .single()
    if (error) throw error

    // 6. Notificaciones (Asíncronas)
    this.enviarNotificacionesInscripcion(estudianteId, sesionActual);

    return data
  },

  async enviarNotificacionesInscripcion(estudianteId, sesion) {
    try {
      // Obtener datos del estudiante (necesitamos el teléfono y correo)
      const { data: est } = await supabase
        .from('estudiantes')
        .select('*')
        .eq('id', estudianteId)
        .single();

      if (est) {
        // Enviar Telegram
        telegramService.sendSessionConfirmation(est, sesion);

        // Enviar Correo vía GAS
        gasService.sendEmail({
          to: est.correo,
          subject: `Confirmación: ${sesion.nombre}`,
          type: 'SESSION_CONFIRMATION',
          data: {
            nombre: est.nombre,
            sesion_nombre: sesion.nombre,
            fecha: sesion.dias_jornada?.nombre_dia,
            hora: sesion.hora_inicio.slice(0, 5),
            lugar: sesion.escenarios?.nombre
          }
        });
      }
    } catch (err) {
      console.error('Error al enviar notificaciones de inscripción:', err);
    }
  },

  async cancelar(estudianteId, sesionId) {
    const { error } = await supabase
      .from('inscripciones')
      .delete()
      .eq('estudiante_id', estudianteId)
      .eq('sesion_id', sesionId)
    if (error) throw error
  },

  async cancelarPorId(inscripcionId) {
    const { error } = await supabase
      .from('inscripciones')
      .delete()
      .eq('id', inscripcionId)
    if (error) throw error
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

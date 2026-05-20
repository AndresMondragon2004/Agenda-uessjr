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
    // 1. Verificar si ya está inscrito o en lista de espera en ESTA sesión
    const { data: existing } = await supabase
      .from('inscripciones')
      .select('id')
      .eq('estudiante_id', estudianteId)
      .eq('sesion_id', sesionId)
      .maybeSingle()
    if (existing) throw new Error('Ya tienes un registro (inscrito o en lista de espera) en esta sesión')

    // 2. Obtener datos de la sesión actual (horario y cupo)
    const { data: sesionActual, error: sErr } = await supabase
      .from('sesiones')
      .select('*, escenarios(capacidad_maxima), dias_jornada(fecha, nombre_dia)')
      .eq('id', sesionId)
      .single()
    
    if (sErr) throw sErr

    // 3. Determinar estado inicial según el cupo
    let estado = 'confirmada'
    const cupo = sesionActual?.escenarios?.capacidad_maxima
    if (cupo) {
      const { count } = await supabase
        .from('inscripciones')
        .select('*', { count: 'exact', head: true })
        .eq('sesion_id', sesionId)
        .eq('estado', 'confirmada')
      if (count >= cupo) {
        estado = 'lista_espera'
      }
    }

    // 4. Verificar traslape de horarios (SOLO si se confirma la sesión)
    if (estado === 'confirmada') {
      const { data: misInscripciones } = await supabase
        .from('inscripciones')
        .select('sesiones(nombre, hora_inicio, hora_fin, dias_jornada(fecha))')
        .eq('estudiante_id', estudianteId)
        .eq('estado', 'confirmada')
      
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
        throw new Error(`Conflicto de horario: Ya tienes una sesión confirmada a esta hora ("${tieneTraslape.sesiones.nombre}")`)
      }
    }

    // 5. Insertar
    const { data, error } = await supabase
      .from('inscripciones')
      .insert([{ estudiante_id: estudianteId, sesion_id: sesionId, estado }])
      .select()
      .single()
    if (error) throw error

    // 6. Notificaciones (Asíncronas)
    if (estado === 'confirmada') {
      this.enviarNotificacionesInscripcion(estudianteId, sesionActual);
    } else {
      this.enviarNotificacionesListaEspera(estudianteId, sesionActual);
    }

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

  async enviarNotificacionesListaEspera(estudianteId, sesion) {
    try {
      const { data: est } = await supabase
        .from('estudiantes')
        .select('*')
        .eq('id', estudianteId)
        .single();

      if (est) {
        // Enviar Telegram
        if (est.telegram_chat_id) {
          const msg = `⏳ Estás en lista de espera para: *${sesion.nombre}*.\n\nTe notificaremos automáticamente si se libera un espacio. 😊`;
          telegramService.sendMessage(est.telegram_chat_id, msg).catch(console.error);
        }

        // Enviar Correo vía GAS
        gasService.sendEmail({
          to: est.correo,
          subject: `En lista de espera: ${sesion.nombre}`,
          type: 'WAITLIST_CONFIRMATION',
          data: {
            nombre: est.nombre,
            sesion_nombre: sesion.nombre,
            fecha: sesion.dias_jornada?.nombre_dia,
            hora: sesion.hora_inicio.slice(0, 5),
            lugar: sesion.escenarios?.nombre
          }
        }).catch(console.error);
      }
    } catch (err) {
      console.error('Error al enviar notificaciones de lista de espera:', err);
    }
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

        // 3. Obtener detalles de la sesión para notificar
        const { data: sesionActual } = await supabase
          .from('sesiones')
          .select('*, escenarios(nombre), dias_jornada(nombre_dia)')
          .eq('id', sesionId)
          .single()

        if (sesionActual) {
          // 4. Enviar notificaciones de promoción
          const { data: est } = await supabase
            .from('estudiantes')
            .select('*')
            .eq('id', waitlisted.estudiante_id)
            .single()

          if (est) {
            // Telegram
            if (est.telegram_chat_id) {
              const msg = `🎉 ¡Buenas noticias, *${est.nombre}*!\n\nSe ha liberado un lugar y tu inscripción para *${sesionActual.nombre}* ha sido CONFIRMADA. ✅\n\n📍 Lugar: ${sesionActual.escenarios?.nombre || 'Por confirmar'}\n📅 Fecha: ${sesionActual.dias_jornada?.nombre_dia}\n🕒 Hora: ${sesionActual.hora_inicio.slice(0, 5)}`;
              telegramService.sendMessage(est.telegram_chat_id, msg).catch(console.error);
            }

            // Correo
            gasService.sendEmail({
              to: est.correo,
              subject: `¡Inscripción Confirmada! ${sesionActual.nombre}`,
              type: 'WAITLIST_PROMOTED',
              data: {
                nombre: est.nombre,
                sesion_nombre: sesionActual.nombre,
                fecha: sesionActual.dias_jornada?.nombre_dia,
                hora: sesionActual.hora_inicio.slice(0, 5),
                lugar: sesionActual.escenarios?.nombre
              }
            }).catch(console.error);
          }
        }
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

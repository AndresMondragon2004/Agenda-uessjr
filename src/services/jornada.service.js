import { supabase } from './supabase'
import { actividadService } from './actividad.service'

const NOMBRES_DIA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export const jornadaService = {

  async getActiva() {
    const { data, error } = await supabase
      .from('jornadas')
      .select(`*, dias_jornada(*)`)
      .eq('estado', 'activa')
      .order('fecha_inicio', { ascending: true })
      .limit(1)
      .single()
    if (error) throw error
    if (data?.dias_jornada) {
      data.dias_jornada.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    }
    return data
  },

  async getAll() {
    const { data, error } = await supabase
      .from('jornadas')
      .select(`*, dias_jornada(*)`)
      .order('fecha_inicio', { ascending: false })
    if (error) throw error
    return data
  },

  async create(jornada, adminName = 'Sistema') {
    const { data, error } = await supabase
      .from('jornadas')
      .insert([jornada])
      .select()
      .single()
    if (error) throw error
    
    await actividadService.logActividad(
      'jornada',
      'crear',
      `${adminName} creó la jornada: ${jornada.nombre}`,
      { nuevo: data },
      adminName
    )
    
    return data
  },

  async update(id, jornada, adminName = 'Sistema') {
    // Obtener estado anterior para el log detallado
    const { data: oldData } = await supabase
      .from('jornadas')
      .select('*')
      .eq('id', id)
      .single()

    const { data, error } = await supabase
      .from('jornadas')
      .update(jornada)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    await actividadService.logActividad(
      'jornada',
      'modificar',
      `${adminName} modificó la jornada: ${data.nombre}`,
      { antes: oldData, despues: data },
      adminName
    )

    return data
  },

  async delete(id, adminName = 'Sistema') {
    // Obtener nombre antes de borrar
    const { data: oldData } = await supabase
      .from('jornadas')
      .select('nombre')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('jornadas')
      .delete()
      .eq('id', id)
    if (error) throw error

    await actividadService.logActividad(
      'jornada',
      'eliminar',
      `${adminName} eliminó la jornada: ${oldData?.nombre || id}`,
      { eliminado: oldData },
      adminName
    )
  },

  async setActiva(id, adminName = 'Sistema') {
    // Obtener info de la jornada a activar
    const { data: targetJornada } = await supabase
      .from('jornadas')
      .select('nombre')
      .eq('id', id)
      .single()

    await supabase
      .from('jornadas')
      .update({ estado: 'finalizada' })
      .neq('id', id)
    const { data, error } = await supabase
      .from('jornadas')
      .update({ estado: 'activa' })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    await actividadService.logActividad(
      'jornada',
      'activar',
      `${adminName} activó la jornada: ${targetJornada?.nombre || id}`,
      { jornada_id: id },
      adminName
    )

    return data
  },

  async crearDias(jornadaId, fechaInicio, fechaFin) {
    const dias = []
    let current = new Date(fechaInicio + 'T12:00:00')
    const end = new Date(fechaFin + 'T12:00:00')
    while (current <= end) {
      dias.push({
        jornada_id: jornadaId,
        fecha: current.toISOString().split('T')[0],
        nombre_dia: NOMBRES_DIA[current.getDay()],
      })
      current.setDate(current.getDate() + 1)
    }
    const { error } = await supabase.from('dias_jornada').insert(dias)
    if (error) throw error
  },

  async deleteDia(id) {
    const { error } = await supabase.from('dias_jornada').delete().eq('id', id)
    if (error) throw error
  },

  async deleteDiasByJornada(jornadaId) {
    const { error } = await supabase
      .from('dias_jornada')
      .delete()
      .eq('jornada_id', jornadaId)
    if (error) throw error
  },

  async agregarUnDia(jornadaId, fecha) {
    const d = new Date(fecha + 'T12:00:00')
    const { data, error } = await supabase
      .from('dias_jornada')
      .insert([{
        jornada_id: jornadaId,
        fecha: fecha,
        nombre_dia: NOMBRES_DIA[d.getDay()],
      }])
      .select()
      .single()
    if (error) throw error
    return data
  },
}

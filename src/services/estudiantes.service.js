import { supabase } from './supabase'
import { actividadService } from './actividad.service'

export const estudiantesService = {

  async getAll() {
    const { data, error } = await supabase
      .from('estudiantes')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('estudiantes')
      .select(`
        *,
        inscripciones(
          *,
          sesiones(id, nombre, hora_inicio, hora_fin,
            dias_jornada(nombre_dia, fecha),
            escenarios(nombre))
        )
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async update(id, datos, adminName = 'Sistema') {
    // Obtener datos anteriores
    const { data: oldData } = await supabase
      .from('estudiantes')
      .select('*')
      .eq('id', id)
      .single()

    const { data, error } = await supabase
      .from('estudiantes')
      .update(datos)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    await actividadService.logActividad(
      'estudiante',
      'modificar',
      `${adminName} modificó al estudiante: ${data.nombre} ${data.apellidos}`,
      { antes: oldData, despues: data },
      adminName
    )

    return data
  },

  async create(datos, adminName = 'Sistema') {
    const { data, error } = await supabase
      .from('estudiantes')
      .insert([datos])
      .select()
      .single()
    if (error) throw error

    await actividadService.logActividad(
      'estudiante',
      'crear',
      `${adminName} registró manualmente al estudiante: ${data.nombre} ${data.apellidos}`,
      { nuevo: data },
      adminName
    )

    return data
  },

  async delete(id, adminName = 'Sistema') {
    const { data: oldData } = await supabase
      .from('estudiantes')
      .select('nombre, apellidos')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('estudiantes')
      .delete()
      .eq('id', id)
    if (error) throw error

    await actividadService.logActividad(
      'estudiante',
      'eliminar',
      `${adminName} eliminó al estudiante: ${oldData?.nombre} ${oldData?.apellidos}`,
      { eliminado: oldData },
      adminName
    )
  }
}

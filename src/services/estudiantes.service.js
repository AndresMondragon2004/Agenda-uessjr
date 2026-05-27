import { supabase } from './supabase'

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

  async update(id, datos) {
    const { data, error } = await supabase
      .from('estudiantes')
      .update(datos)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase
      .from('estudiantes')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}

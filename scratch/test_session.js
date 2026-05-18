import { supabase } from './supabase'

export const sesionesService = {

  async getAll() {
    const { data, error } = await supabase
      .from('sesiones')
      .select(`
        *,
        dias_jornada(id, fecha, nombre_dia),
        escenarios(id, nombre, capacidad_maxima),
        instituciones(id, nombre, logotipo_url)
      `)
      .order('hora_inicio', { ascending: true })
    if (error) throw error
    return data
  },

  async getByJornada(jornadaId) {
    const { data, error } = await supabase
      .from('sesiones')
      .select(`
        *,
        dias_jornada(id, fecha, nombre_dia),
        escenarios(id, nombre, capacidad_maxima)
      `)
      .eq('jornada_id', jornadaId)
      .order('hora_inicio', { ascending: true })
    if (error) throw error
    return data
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('sesiones')
      .select(`
        *,
        dias_jornada(id, fecha, nombre_dia),
        escenarios(id, nombre, capacidad_maxima),
        instituciones(id, nombre, logotipo_url)
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async create(sesion) {
    const { data, error } = await supabase
      .from('sesiones')
      .insert([sesion])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, sesion) {
    const { data, error } = await supabase
      .from('sesiones')
      .update(sesion)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateEstado(id, estado) {
    const { data, error } = await supabase
      .from('sesiones')
      .update({ estado })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase
      .from('sesiones')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async getTotalInscritos(sesionId) {
    const { count, error } = await supabase
      .from('inscripciones')
      .select('*', { count: 'exact', head: true })
      .eq('sesion_id', sesionId)
      .eq('estado', 'confirmada')
    if (error) throw error
    return count || 0
  }
}
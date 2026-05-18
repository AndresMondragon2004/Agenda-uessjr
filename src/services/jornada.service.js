import { supabase } from './supabase'

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

  async create(jornada) {
    const { data, error } = await supabase
      .from('jornadas')
      .insert([jornada])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, jornada) {
    const { data, error } = await supabase
      .from('jornadas')
      .update(jornada)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase
      .from('jornadas')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async setActiva(id) {
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

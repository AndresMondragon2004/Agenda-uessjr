import { supabase } from './supabase'

export const sesionesService = {

  async getAll() {
    const { data, error } = await supabase
      .from('sesiones')
      .select(`
        *,
        dias_jornada(fecha, nombre_dia),
        escenarios(nombre, capacidad_maxima),
        instituciones(nombre)
      `)
      .order('hora_inicio', { ascending: true })
    if (error) throw error
    return data
  },

  async getByJornada(jornadaId) {
    const [{ data, error }, { data: conteos }] = await Promise.all([
      supabase
        .from('sesiones')
        .select(`
          *,
          dias_jornada(fecha, nombre_dia),
          escenarios(nombre, capacidad_maxima)
        `)
        .eq('jornada_id', jornadaId)
        .order('hora_inicio', { ascending: true }),
      supabase.rpc('get_inscritos_por_jornada', { jornada_uuid: jornadaId })
    ])
    if (error) throw error

    const countMap = Object.fromEntries(
      (conteos || []).map(r => [r.sesion_id, Number(r.total)])
    )
    return (data || []).map(s => ({ ...s, total_inscritos: countMap[s.id] || 0 }))
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('sesiones')
      .select(`
        *,
        dias_jornada(fecha, nombre_dia),
        escenarios(nombre, capacidad_maxima),
        instituciones(nombre, logotipo_url)
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async create(sesion) {
    const payload = { ...sesion }
    delete payload.dias_jornada
    delete payload.escenarios
    delete payload.instituciones
    
    const { data, error } = await supabase
      .from('sesiones')
      .insert([payload])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, sesion) {
    const payload = { ...sesion }
    delete payload.dias_jornada
    delete payload.escenarios
    delete payload.instituciones
    delete payload.id
    
    const { data, error } = await supabase
      .from('sesiones')
      .update(payload)
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

  async checkSolapamiento(escenarioId, diaJornadaId, horaInicio, horaFin, excludeId = null) {
    let query = supabase
      .from('sesiones')
      .select('id, nombre, hora_inicio, hora_fin')
      .eq('escenario_id', escenarioId)
      .eq('dia_jornada_id', diaJornadaId)
      .neq('estado', 'cancelada')
      .lt('hora_inicio', horaFin)
      .gt('hora_fin', horaInicio)
    if (excludeId) query = query.neq('id', excludeId)
    const { data, error } = await query
    if (error) throw error
    return data || []
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

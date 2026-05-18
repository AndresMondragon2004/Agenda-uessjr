import { supabase } from './supabase'

export const propuestasService = {

  async getAll() {
    const { data, error } = await supabase
      .from('propuestas')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('propuestas')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async create(propuesta) {
    const payload = { ...propuesta }
    delete payload.id

    const { data, error } = await supabase
      .from('propuestas')
      .insert([payload])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, datos) {
    const payload = { ...datos }
    delete payload.id

    const { data, error } = await supabase
      .from('propuestas')
      .update(payload)
      .eq('id', id)
      .select()
    if (error) throw new Error(`Error al actualizar: ${error.message}`)
    if (!data || data.length === 0) throw new Error('No se pudo actualizar la propuesta. Verifica los permisos en Supabase (política RLS de UPDATE).')
    return data[0]
  },

  async updateEstado(id, estado) {
    const { data, error } = await supabase
      .from('propuestas')
      .update({ estado })
      .eq('id', id)
      .select()
    if (error) throw new Error(`Error al actualizar estado: ${error.message}`)
    if (!data || data.length === 0) throw new Error('No se pudo actualizar el estado. Verifica los permisos en Supabase (política RLS de UPDATE).')
    return data[0]
  },

  async delete(id) {
    const { error } = await supabase
      .from('propuestas')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}

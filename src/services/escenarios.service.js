import { supabase } from './supabase'

export const escenariosService = {
  async getAll() {
    const { data, error } = await supabase
      .from('escenarios')
      .select('*')
      .order('nombre')
    if (error) throw error
    return data
  },

  async create(escenario) {
    const { data, error } = await supabase
      .from('escenarios')
      .insert([escenario])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, escenario) {
    const { data, error } = await supabase
      .from('escenarios')
      .update(escenario)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase
      .from('escenarios')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}

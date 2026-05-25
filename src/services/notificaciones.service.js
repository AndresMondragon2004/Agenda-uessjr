import { supabase } from './supabase'

export const notificacionesService = {
  /**
   * Crea una notificación para un usuario específico o para todos (global)
   */
  async create({ titulo, mensaje, tipo = 'info', estudiante_id = null }) {
    const { data, error } = await supabase
      .from('notificaciones')
      .insert([{
        titulo,
        mensaje,
        tipo,
        estudiante_id, // Si es null, es global
        leida: false
      }])
      .select()
    if (error) throw error
    return data
  },

  /**
   * Obtiene notificaciones para el estudiante actual (incluye las globales)
   */
  async getForStudent(estudianteId) {
    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .or(`estudiante_id.eq.${estudianteId},estudiante_id.is.null`)
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (error) throw error
    return data
  },

  /**
   * Marca una notificación como leída
   */
  async markAsRead(id) {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('id', id)
    if (error) throw error
  },

  /**
   * Elimina todas las notificaciones personales del estudiante
   */
  async clearAll(estudianteId) {
    const { error } = await supabase
      .from('notificaciones')
      .delete()
      .eq('estudiante_id', estudianteId)
    if (error) throw error
  }
}

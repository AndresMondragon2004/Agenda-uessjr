import { supabase } from './supabase'

export const actividadService = {
  /**
   * Registra una nueva acción en la bitácora de actividad reciente.
   * @param {string} entidad_tipo - 'jornada', 'estudiante', 'sesion', 'propuesta', etc.
   * @param {string} accion - 'crear', 'modificar', 'eliminar', 'registro', etc.
   * @param {string} descripcion - Descripción legible por humanos.
   * @param {object} detalles - Objeto con datos adicionales (ej. { antes: {}, después: {} }).
   * @param {string} usuario_nombre - Nombre del usuario/admin que realiza la acción.
   */
  async logActividad(entidad_tipo, accion, descripcion, detalles = null, usuario_nombre = 'Sistema') {
    try {
      const { data, error } = await supabase
        .from('actividad_reciente')
        .insert([{
          entidad_tipo,
          accion,
          descripcion,
          detalles,
          usuario_nombre
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (err) {
      console.error('Error logging activity:', err)
      // No lanzamos el error para no interrumpir el flujo principal de la app
      return null
    }
  },

  /**
   * Obtiene los últimos registros de actividad.
   * @param {number} limite - Cantidad de registros a recuperar.
   */
  async getRecientes(limite = 10) {
    const { data, error } = await supabase
      .from('actividad_reciente')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limite)
    
    if (error) throw error
    return data || []
  }
}

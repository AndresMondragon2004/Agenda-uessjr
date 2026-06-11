import { supabase } from './supabase'

export const votosService = {
  /**
   * Obtiene el resumen de votos para una sesión.
   * @param {string} sesionId
   */
  async getResumen(sesionId) {
    const { data, error } = await supabase
      .from('votos_sesion')
      .select('voto')
      .eq('sesion_id', sesionId)

    if (error) throw error

    const likes = data.filter(v => v.voto === 1).length
    const dislikes = data.filter(v => v.voto === -1).length

    return { likes, dislikes, total: data.length }
  },

  /**
   * Obtiene el voto del estudiante actual para una sesión.
   * @param {string} sesionId
   * @param {string} estudianteId
   */
  async getVotoUsuario(sesionId, estudianteId) {
    if (!estudianteId) return null
    const { data, error } = await supabase
      .from('votos_sesion')
      .select('voto')
      .eq('sesion_id', sesionId)
      .eq('estudiante_id', estudianteId)
      .maybeSingle()

    if (error) throw error
    return data ? data.voto : null
  },

  /**
   * Registra o actualiza un voto.
   * @param {string} sesionId
   * @param {string} estudianteId
   * @param {number} valor - 1 para like, -1 para dislike
   */
  async votar(sesionId, estudianteId, valor) {
    // Si ya existe un voto con el mismo valor, lo eliminamos (toggle)
    const votoActual = await this.getVotoUsuario(sesionId, estudianteId)

    if (votoActual === valor) {
      const { error } = await supabase
        .from('votos_sesion')
        .delete()
        .eq('sesion_id', sesionId)
        .eq('estudiante_id', estudianteId)
      if (error) throw error
      return null
    }

    // Upsert del voto
    const { data, error } = await supabase
      .from('votos_sesion')
      .upsert({
        sesion_id: sesionId,
        estudiante_id: estudianteId,
        voto: valor
      }, { onConflict: 'sesion_id,estudiante_id' })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Obtiene el ranking de sesiones por likes para el admin.
   */
  async getRankingLikes(limit = 10) {
    const { data, error } = await supabase
      .from('votos_sesion')
      .select('sesion_id, sesiones(nombre), voto')
    
    if (error) throw error

    // Agrupar y contar
    const stats = data.reduce((acc, curr) => {
      const id = curr.sesion_id
      if (!acc[id]) acc[id] = { id, nombre: curr.sesiones.nombre, likes: 0, dislikes: 0 }
      if (curr.voto === 1) acc[id].likes++
      if (curr.voto === -1) acc[id].dislikes++
      return acc
    }, {})

    return Object.values(stats)
      .sort((a, b) => b.likes - a.likes)
      .slice(0, limit)
  },

  /**
   * Obtiene los conteos de likes/dislikes de todas las sesiones de una jornada.
   */
  async getAllCounts() {
    const { data, error } = await supabase
      .from('votos_sesion')
      .select('sesion_id, voto')
    
    if (error) throw error

    const counts = data.reduce((acc, curr) => {
      if (!acc[curr.sesion_id]) acc[curr.sesion_id] = { likes: 0, dislikes: 0 }
      if (curr.voto === 1) acc[curr.sesion_id].likes++
      if (curr.voto === -1) acc[curr.sesion_id].dislikes++
      return acc
    }, {})

    return counts
  }
}

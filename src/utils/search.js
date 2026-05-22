/**
 * Normaliza un texto para búsqueda tolerante a:
 * - Acentos y tildes (á → a, é → e, ñ → n, ü → u, etc.)
 * - Mayúsculas/minúsculas
 * - Espacios en los extremos
 * - Valores nulos o no-string
 *
 * @param {*} value - El valor a normalizar (string, número, null, undefined)
 * @returns {string} El texto normalizado listo para comparar con .includes()
 */
export function norm(value) {
  if (value == null) return ''
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // elimina diacríticos (tildes, cedillas, diéresis…)
    .toLowerCase()
    .trim()
}

/**
 * Verifica si un valor contiene el término de búsqueda,
 * usando comparación normalizada (sin acentos, sin case).
 *
 * @param {*} value - El campo a revisar
 * @param {string} query - El término ya normalizado con norm()
 * @returns {boolean}
 */
export function matchSearch(value, query) {
  return norm(value).includes(query)
}

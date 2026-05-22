import { parseISO, format, isValid } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Parsea una fecha en formato YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss de forma segura
 * evitando el bug de "Invalid Date" en Safari/iOS.
 */
export function parseSafeDate(dateString, timeString = '00:00:00') {
  if (!dateString) return null;

  // Si ya tiene la T, es un datetime string. Si no, lo concatenamos.
  const isoString = dateString.includes('T') ? dateString : `${dateString}T${timeString}`;
  
  // Usamos date-fns parseISO que es cross-browser safe
  const parsedDate = parseISO(isoString);
  
  // Fallback si no es válida, usando replace (Safari fix básico)
  if (!isValid(parsedDate)) {
    const fallbackStr = isoString.replace(/-/g, '/').replace('T', ' ');
    const fallbackDate = new Date(fallbackStr);
    return isValid(fallbackDate) ? fallbackDate : new Date();
  }

  return parsedDate;
}

/**
 * Formatea un dia corto (Ej: Mié 15)
 */
export function formatShortDaySafe(dateString) {
  const date = parseSafeDate(dateString, '12:00:00'); // Mediodía para evitar saltos de zona horaria
  if (!date) return '—';
  
  const nombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return `${nombres[date.getDay()]} ${date.getDate()}`;
}

/**
 * Formato largo: "miércoles 15 de mayo de 2024"
 */
export function formatLongDateSafe(dateString) {
    const date = parseSafeDate(dateString, '12:00:00');
    if (!date) return '—';
    return format(date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
}

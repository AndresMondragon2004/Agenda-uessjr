/**
 * Servicio para integración con Google Apps Script (GAS)
 * Maneja el envío de correos electrónicos con plantillas personalizadas.
 */

const GAS_WEBAPP_URL = import.meta.env.VITE_GAS_URL || '';

export const gasService = {
  /**
   * Envía un correo electrónico a través de GAS
   * @param {Object} payload 
   * @param {string} payload.to - Correo del destinatario
   * @param {string} payload.subject - Asunto del correo
   * @param {string} payload.type - Tipo de correo (WELCOME, RESET_PASSWORD, SESSION_CONFIRM, etc.)
   * @param {Object} payload.data - Datos para la plantilla (nombre, link, etc.)
   */
  async sendEmail({ to, subject, type, data }) {
    if (!GAS_WEBAPP_URL) {
      console.warn('GAS_WEBAPP_URL no configurada. El correo no se enviará.');
      return null;
    }

    console.log(`Intentando enviar correo vía GAS a: ${to} (Tipo: ${type})`);
    console.log('Payload:', { to, subject, type, data });

    try {
      // Usamos mode: 'no-cors' y text/plain para evitar el preflight de CORS.
      // NOTA: Con 'no-cors' no podemos leer la respuesta (success/error), 
      // pero la petición sí llega al servidor de Google y se ejecuta.
      await fetch(GAS_WEBAPP_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({ to, subject, type, data }),
      });
      
      console.log('Petición enviada a Google Apps Script exitosamente.');
      return { success: true };
    } catch (error) {
      console.error('Error al enviar correo vía GAS:', error);
      throw error;
    }
  }
};

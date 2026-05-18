/**
 * Servicio para integración con Telegram Bot API
 * Permite enviar notificaciones gratuitas y sin restricciones.
 */

const GAS_URL = import.meta.env.VITE_GAS_URL;

export const whatsappService = { // Mantenemos el nombre de exportación temporalmente para evitar errores en otros archivos
  /**
   * Envía la orden de envío de mensaje a nuestro proxy en GAS (Google Apps Script)
   * Ahora GAS se encargará de entregarlo a Telegram.
   */
  async sendMessage(chatId, message) {
    if (!GAS_URL) {
      console.warn('VITE_GAS_URL no configurada.');
      return null;
    }

    console.log(`Solicitando envío de Telegram a GAS para ID: ${chatId}`);

    try {
      await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          type: 'TELEGRAM', 
          to: chatId,
          message: message
        }),
      });
      
      console.log('Orden de Telegram enviada a Google Apps Script.');
      return { success: true };
    } catch (error) {
      console.error('Error al solicitar envío de Telegram:', error);
      return null;
    }
  },

  /**
   * Envía un mensaje de bienvenida con el link al Ticket Digital (QR)
   */
  async sendWelcomeQR(estudiante) {
    const ticketLink = `${window.location.origin}/ticket/${estudiante.id}`;
    const msg = `¡Hola ${estudiante.nombre}! 👋 Bienvenido a la 12va Jornada Académica y Cultural de la UES SJR.\n\nTu registro ha sido exitoso.\n\n🎟️ *Tu Ticket Digital (QR de acceso):*\n${ticketLink}\n\n📌 Preséntalo al llegar a tus sesiones.\n\n¡Nos vemos pronto! 🚀`;
    // Nota: El 'telefono' ahora actuará como el ID de Telegram o nombre de usuario
    return this.sendMessage(estudiante.telefono, msg);
  },

  /**
   * Notificación de inscripción a sesión
   */
  async sendSessionConfirmation(estudiante, sesion) {
    const msg = `¡Confirmado! ✅ Te has inscrito a: *${sesion.nombre}*.\n\n📅 Fecha: ${sesion.dias_jornada?.nombre_dia}\n🕒 Hora: ${sesion.hora_inicio.slice(0, 5)}\n📍 Lugar: ${sesion.escenarios?.nombre || 'Por confirmar'}\n\n¡Te esperamos! 😊`;
    return this.sendMessage(estudiante.telefono, msg);
  }
};

/**
 * Servicio para integración con WhatsApp
 * Actualmente configurado para usar un bridge o API externa.
 */

const WHATSAPP_API_URL = import.meta.env.VITE_WHATSAPP_API_URL || '';

export const whatsappService = {
  /**
   * Envía un mensaje de WhatsApp
   * @param {string} phone - Número de teléfono (con código de país si es necesario)
   * @param {string} message - Contenido del mensaje
   */
  async sendMessage(phone, message) {
    console.log(`Simulando envío de WhatsApp a ${phone}: ${message}`);
    
    if (!WHATSAPP_API_URL) {
      // Si no hay API configurada, podemos usar el enlace directo como fallback para el cliente
      const encodedMsg = encodeURIComponent(message);
      return `https://wa.me/${phone}?text=${encodedMsg}`;
    }

    try {
      const response = await fetch(WHATSAPP_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error al enviar WhatsApp:', error);
      return null;
    }
  },

  /**
   * Genera un mensaje de bienvenida con el link al Ticket Digital (QR)
   */
  async sendWelcomeQR(estudiante) {
    const ticketLink = `${window.location.origin}/ticket/${estudiante.id}`;
    const msg = `¡Hola ${estudiante.nombre}! 👋 Bienvenido a la 12va Jornada Académica y Cultural de la UES San José del Rincón. 🏛️\n\nTu registro ha sido exitoso.\n\n🎟️ *Tu Ticket Digital (QR de acceso):*\n${ticketLink}\n\n📌 Preséntalo al llegar a tus sesiones para registrar tu asistencia.\n\n¡Nos vemos pronto! 🚀`;
    return this.sendMessage(estudiante.telefono, msg);
  },

  /**
   * Notificación de inscripción a sesión
   */
  async sendSessionConfirmation(estudiante, sesion) {
    const msg = `¡Confirmado! ✅ Te has inscrito a la sesión: *${sesion.nombre}*.\n\n📅 Fecha: ${sesion.dias_jornada?.nombre_dia}\n🕒 Hora: ${sesion.hora_inicio.slice(0, 5)}\n📍 Lugar: ${sesion.escenarios?.nombre || 'Por confirmar'}\n\n¡Te esperamos! 😊`;
    return this.sendMessage(estudiante.telefono, msg);
  }
};

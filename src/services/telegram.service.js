/**
 * Servicio para integración con Telegram Bot API
 * Utiliza Supabase Edge Functions.
 */

import { supabase } from './supabase';

export const telegramService = {
  /**
   * Envía la orden de envío de mensaje a nuestra Edge Function
   */
  async sendMessage(chatId, message) {
    console.log(`Solicitando envío de Telegram a Edge Function para ID: ${chatId}`);

    try {
      const { data, error } = await supabase.functions.invoke('telegram', {
        body: { type: 'TELEGRAM', to: chatId, message: message },
      });
      
      if (error) throw error;
      
      console.log('Orden de Telegram enviada a Supabase Edge Function.');
      return { success: true, data };
    } catch (error) {
      console.error('Error al solicitar envío de Telegram:', error);
      return null;
    }
  },

  /**
   * Envía un mensaje de bienvenida con el link al Ticket Digital (QR)
   * (Nota: Se llama internamente o desde el webhook, ya no desde AuthContext)
   */
  async sendWelcomeQR(estudiante) {
    const chatId = estudiante.telegram_chat_id;
    if (!chatId) return null;
    
    const ticketLink = `${window.location.origin}/ticket/${estudiante.id}`;
    const msg = `¡Hola ${estudiante.nombre}! 👋 Bienvenido a la 12va Jornada Académica y Cultural de la UES SJR.\n\nTu registro ha sido exitoso.\n\n🎟️ *Tu Ticket Digital (QR de acceso):*\n${ticketLink}\n\n📌 Preséntalo al llegar a tus sesiones.\n\n¡Nos vemos pronto! 🚀`;
    return this.sendMessage(chatId, msg);
  },

  /**
   * Notificación de inscripción a sesión
   */
  async sendSessionConfirmation(estudiante, sesion) {
    const chatId = estudiante.telegram_chat_id;
    if (!chatId) {
      console.warn('El estudiante no ha enlazado su Telegram.');
      return null;
    }

    const msg = `¡Confirmado! ✅ Te has inscrito a: *${sesion.nombre}*.\n\n📅 Fecha: ${sesion.dias_jornada?.nombre_dia}\n🕒 Hora: ${sesion.hora_inicio.slice(0, 5)}\n📍 Lugar: ${sesion.escenarios?.nombre || 'Por confirmar'}\n\n¡Te esperamos! 😊`;
    return this.sendMessage(chatId, msg);
  }
};

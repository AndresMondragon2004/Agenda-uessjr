/**
 * TELEGRAM WEBHOOK PARA MATCH DE NÚMERO DE TELÉFONO - UESSJR
 * 
 * INSTRUCCIONES:
 * 1. Pega este código en Google Apps Script.
 * 2. Pon tus datos reales en las constantes.
 * 3. Implementa como "Nueva Aplicación Web" (con acceso para "Cualquiera").
 * 4. Copia la URL que te da Google.
 * 5. Abre tu navegador y pega esta URL (reemplazando los datos):
 *    https://api.telegram.org/bot<TU_TOKEN>/setWebhook?url=<URL_DE_GOOGLE>
 */

const TELEGRAM_TOKEN = "8886704517:AAH7hFV4CHkiuJE5lmi7pS9xewNsxfgoyXU"; // Tu token real
const SUPABASE_URL = "TU_URL_DE_SUPABASE";
const SUPABASE_ANON_KEY = "TU_ANON_KEY_DE_SUPABASE";
const APP_URL = "https://agenda-uessjr.vercel.app"; // URL de tu proyecto

// =====================================================================
// 1. RECEPCIÓN DEL MENSAJE (WEBHOOK)
// =====================================================================
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // CASO A: Mensaje entrante desde Telegram (El alumno escribe al bot)
    if (data.message) {
      handleIncomingTelegram(data.message);
      return ContentService.createTextOutput("OK");
    }
    
    // CASO B: Solicitud saliente desde React (Tu sistema envía un mensaje o correo)
    if (data.type) {
      if (data.type === 'TELEGRAM') {
        enviarTelegram(data.to, data.message);
      } else {
        enviarEmail(data); // WELCOME, SESSION_CONFIRMATION, etc.
      }
      return ContentService.createTextOutput("OK");
    }

  } catch(err) {
    console.error("Error global:", err);
    return ContentService.createTextOutput("Error");
  }
}

// =====================================================================
// 2. LÓGICA DE MATCH (TELEGRAM -> SUPABASE)
// =====================================================================
function handleIncomingTelegram(msg) {
  const chatId = msg.chat.id;
  const texto = msg.text || "";

  // Cuando el usuario le da "Start" al bot
  if (texto === "/start") {
    // Le pedimos que comparta su contacto (Telegram tiene un botón especial para esto)
    const replyMarkup = {
      keyboard: [[{ text: "📲 Compartir mi número para enlazar cuenta", request_contact: true }]],
      resize_keyboard: true,
      one_time_keyboard: true
    };
    enviarTelegram(chatId, "¡Hola! Bienvenido al Bot Oficial de la UESSJR Agenda. 🎓\n\nPara enlazar tu cuenta y enviarte tus tickets, por favor presiona el botón de abajo para compartir tu número de teléfono.", replyMarkup);
    return;
  }

  // Cuando el usuario presiona el botón y comparte su contacto
  if (msg.contact) {
    let phoneNumber = msg.contact.phone_number;
    // Limpiar el número (quitar +, espacios)
    phoneNumber = phoneNumber.replace(/\D/g, ''); 
    // Opcional: Ajustar lógica si es número de México (aveces llega con 52 o 521)
    if (phoneNumber.startsWith("521")) phoneNumber = phoneNumber.substring(3);
    else if (phoneNumber.startsWith("52")) phoneNumber = phoneNumber.substring(2);

    enviarTelegram(chatId, "Buscando tu registro con el número: " + phoneNumber + " ⏳");

    // Buscar en Supabase
    const estudiante = buscarEstudiantePorTelefono(phoneNumber);

    if (estudiante) {
      // MATCH EXITOSO: Guardamos su Chat ID de Telegram en Supabase
      guardarChatIdEnSupabase(estudiante.id, chatId);
      
      const ticketLink = `${APP_URL}/ticket/${estudiante.id}`;
      const exitoMsg = `¡Cuenta enlazada con éxito, ${estudiante.nombre}! 🎉\n\nA partir de ahora recibirás aquí tus confirmaciones y avisos de la jornada.\n\n🎟️ *Aquí está tu Pase de Acceso (QR):*\n${ticketLink}`;
      
      // Quitamos el teclado de contacto
      const removeKeyboard = { remove_keyboard: true };
      enviarTelegram(chatId, exitoMsg, removeKeyboard);
      
    } else {
      // NO HAY MATCH
      enviarTelegram(chatId, "❌ No encontré ningún registro con ese número. Asegúrate de haberte registrado en la plataforma web primero usando este mismo número celular.");
    }
  }
}

// =====================================================================
// 3. FUNCIONES DE SUPABASE
// =====================================================================
function buscarEstudiantePorTelefono(telefono) {
  // Buscamos a alguien cuyo teléfono termine igual (para evitar problemas con el código de país)
  const url = `${SUPABASE_URL}/rest/v1/estudiantes?telefono=like.%${telefono}&select=id,nombre,apellidos`;
  const options = {
    method: "get",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
    }
  };
  
  try {
    const res = UrlFetchApp.fetch(url, options);
    const data = JSON.parse(res.getContentText());
    return data.length > 0 ? data[0] : null;
  } catch (e) {
    return null;
  }
}

function guardarChatIdEnSupabase(estudianteId, telegramChatId) {
  // OJO: Necesitarás añadir una columna 'telegram_chat_id' a tu tabla estudiantes
  const url = `${SUPABASE_URL}/rest/v1/estudiantes?id=eq.${estudianteId}`;
  const payload = { telegram_chat_id: String(telegramChatId) };
  
  const options = {
    method: "patch",
    contentType: "application/json",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
    },
    payload: JSON.stringify(payload)
  };
  
  UrlFetchApp.fetch(url, options);
}

// =====================================================================
// 4. HELPERS DE ENVÍO
// =====================================================================
function enviarTelegram(chatId, texto, replyMarkup = null) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: texto,
    parse_mode: 'Markdown'
  };
  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }
  
  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

function enviarEmail(params) {
  // Tu lógica de envío de email que ya tenías
  let body = `<p>Notificación de la jornada.</p>`;
  if (params.type === 'WELCOME') body = `<h1>Bienvenido a la jornada</h1>`;
  
  MailApp.sendEmail({
    to: params.to,
    subject: params.subject,
    htmlBody: body
  });
}

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || ""
const APP_URL = "https://agenda-uessjr.vercel.app"

serve(async (req) => {
  // Manejo de CORS para peticiones desde el navegador (React)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const data = await req.json()
    console.log("Datos recibidos:", JSON.stringify(data).slice(0, 500))

    // ==========================================
    // CASO A: Petición desde el Frontend React para ENVIAR mensaje
    // Payload esperado: { type: 'TELEGRAM', to: chatId, message: 'Texto' }
    // Requiere JWT válido del usuario autenticado
    // ==========================================
    if (data.type === 'TELEGRAM') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        })
      }

      const token = authHeader.replace('Bearer ', '')
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || ""
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""
      const supabaseAdmin = createClient(supabaseUrl, supabaseKey)
      const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token)
      if (authError || !userData?.user) {
        console.error("JWT inválido:", authError?.message)
        return new Response(JSON.stringify({ error: 'Token inválido' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        })
      }

      console.log(`Envío autorizado por usuario: ${userData.user.id}`)
      await enviarTelegram(data.to, data.message)
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // ==========================================
    // CASO B: Webhook entrante desde la API de Telegram
    // ==========================================
    if (data.message) {
      const chatId = data.message.chat.id
      const text = data.message.text || ""
      const firstName = data.message.from?.first_name || "estudiante"

      console.log(`Webhook de Telegram: chat_id=${chatId}, text="${text}"`)

      if (text.startsWith("/start ")) {
        const studentId = text.split(" ")[1]
        console.log(`Vinculando estudiante ${studentId} con chat_id ${chatId}`)
        await vincularTelegram(studentId, chatId)
        
        const welcomeMsg = `¡Conexión exitosa! 🎉\n\nHola ${firstName}, ya he enlazado tu cuenta. A partir de ahora recibirás aquí tus tickets y avisos de la jornada.\n\n¡Bienvenido(a)! 🎓`
        await enviarTelegram(chatId, welcomeMsg)
        
        const ticketLink = `${APP_URL}/ticket/${studentId}`
        await enviarTelegram(chatId, `🎟️ *Tu Ticket Digital (QR de acceso):*\n${ticketLink}\n\n📌 Preséntalo al llegar a tus sesiones.`)
      } 
      else if (text === "/start") {
        await enviarTelegram(chatId, "Hola 👋. Para vincular tu cuenta, por favor usa el botón azul 'Vincular Telegram' desde la página de tu Agenda en la web. 🌐")
      }
      else if (/^[1-5]$/.test(text.trim())) {
        await manejarFeedback(chatId, text.trim())
      }
      else {
        await responderLocal(chatId, text)
      }
      
      return new Response('OK', { headers: corsHeaders, status: 200 })
    }

    return new Response(JSON.stringify({ error: "Payload no reconocido" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })

  } catch (error) {
    console.error("Error en la Edge Function:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

// =============================================
// FEEDBACK DE SESIONES
// =============================================
async function manejarFeedback(chatId: string | number, calificacion: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ""
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""
  if (!supabaseUrl || !supabaseKey) return;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: estudiante } = await supabase
    .from('estudiantes')
    .select('id')
    .eq('telegram_chat_id', String(chatId))
    .maybeSingle()
    
  if (!estudiante) {
    await responderLocal(chatId, calificacion);
    return;
  }

  const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  
  const { data: log } = await supabase
    .from('telegram_reminders_log')
    .select('sesion_id')
    .eq('estudiante_id', estudiante.id)
    .eq('tipo', 'feedback')
    .gte('created_at', ayer)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!log) {
    await responderLocal(chatId, calificacion);
    return;
  }

  const { data: existingFeedback } = await supabase
    .from('feedback_sesiones')
    .select('id')
    .eq('estudiante_id', estudiante.id)
    .eq('sesion_id', log.sesion_id)
    .maybeSingle()

  if (existingFeedback) {
    await enviarTelegram(chatId, "Ya has calificado esta sesión. ¡Gracias! 😊");
    return;
  }

  const numCalificacion = parseInt(calificacion)
  await supabase.from('feedback_sesiones').insert({
    estudiante_id: estudiante.id,
    sesion_id: log.sesion_id,
    calificacion: numCalificacion
  })

  await enviarTelegram(chatId, `¡Gracias por tu opinión! ⭐ Calificaste con ${numCalificacion}/5.`);
}

// =============================================
// NORMALIZACIÓN DE TEXTO
// =============================================
function normalizarTexto(texto: string): string {
  if (!texto) return "";
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// =============================================
// RESPUESTAS EXACTAS (match completo del texto normalizado)
// =============================================
const RESPUESTAS_EXACTAS: Record<string, string> = {
  // ── Saludos ──
  "hola":             "¡Hola! 👋 Soy el asistente de la Jornada UESSJR.\n\nEscribe *ayuda* para ver todo lo que puedo hacer por ti. 🤖",
  "hola bot":         "¡Hola! 🤖 Estoy aquí para ayudarte. Escribe *ayuda* para ver mis funciones.",
  "hola buenas":      "¡Hola, buenas! 👋 ¿En qué te puedo ayudar?",
  "ola":              "¡Hola! 👋 ¿En qué te puedo ayudar?",
  "hey":              "¡Hey! 👋 ¿Qué necesitas saber sobre la jornada?",
  "que tal":          "¡Hola! 😄 ¿En qué te ayudo?",
  "que onda":         "¡Hola! 🤙 ¿Qué necesitas?",
  "buenos dias":      "¡Buenos días! ☀️ ¿En qué te puedo ayudar hoy?",
  "buenas tardes":    "¡Buenas tardes! 🌤️ ¿En qué te puedo ayudar?",
  "buenas noches":    "¡Buenas noches! 🌙 ¿En qué te puedo ayudar?",
  "buenas":           "¡Buenas! 👋 ¿En qué te ayudo?",
  "buen dia":         "¡Buen día! ☀️ ¿Qué necesitas saber?",
  // ── Despedidas ──
  "gracias":          "¡De nada! 😊 Si tienes más dudas, aquí estaré.",
  "muchas gracias":   "¡Con gusto! 🙌 No dudes en preguntar si necesitas algo más.",
  "ok gracias":       "¡Para servirte! 😊 Aquí estaré si necesitas algo.",
  "vale gracias":     "¡De nada! 😊 Aquí ando por si se te ofrece algo más.",
  "gracias bot":      "¡Para eso estoy! 🤖😊",
  "bye":              "¡Hasta luego! 👋 Mucho éxito en la jornada.",
  "adios":            "¡Nos vemos! 👋🎓",
  "chao":             "¡Chao! 👋 Suerte en tus sesiones.",
  "hasta luego":      "¡Hasta luego! 👋 Aquí estaré cuando me necesites.",
  "nos vemos":        "¡Nos vemos! 👋 Éxito en la jornada. 🎓",
  // ── Confirmaciones / Relleno ──
  "ok":               "👍 Si necesitas algo más, solo pregunta.",
  "okey":             "👍 ¿Algo más en lo que te ayude?",
  "va":               "👍 Si necesitas algo, aquí ando.",
  "simon":            "👍 ¿Te puedo ayudar en algo más?",
  "sale":             "👍 Aquí estaré por si ocupas algo.",
  "si":               "👍 ¿Hay algo más en lo que te pueda ayudar?",
  "no":               "De acuerdo. Si cambias de opinión, aquí estaré. 😊",
  "nel":              "De acuerdo. 😊 Si necesitas algo después, solo escribe.",
  "ya":               "👍 ¿Necesitas algo más?",
  "listo":            "¡Perfecto! ✅ Si ocupas algo más, aquí estoy.",
  // ── Risas / Emojis ──
  "jaja":             "😄 ¿Te puedo ayudar en algo?",
  "jajaja":           "😂 ¿Necesitas algo sobre la jornada?",
  "jajajaja":         "😂 ¡Me alegra! ¿Te ayudo en algo?",
  "xd":               "😄 ¿En qué te ayudo?",
  "lol":              "😂 ¿Necesitas algo?",
  // ── Preguntas sobre el bot ──
  "quien eres":       "🤖 Soy el asistente virtual de la Jornada Académica UESSJR. Puedo ayudarte con tu agenda, ticket, asistencias y más.\n\nEscribe *ayuda* para ver todo lo que puedo hacer.",
  "que eres":         "🤖 Soy un bot creado para ayudarte durante la Jornada Académica UESSJR. Escribe *ayuda* para conocer mis funciones.",
  "como te llamas":   "🤖 Soy el Asistente Virtual de la UESSJR. ¡Mucho gusto! Escribe *ayuda* para ver cómo te puedo ayudar.",
  "eres un robot":    "🤖 ¡Sí! Soy un bot, pero estoy aquí para hacerte la jornada más fácil. Escribe *ayuda* para ver qué puedo hacer.",
  "eres real":        "🤖 Soy un asistente virtual creado para la Jornada UESSJR. No soy humano, ¡pero soy bastante útil! Escribe *ayuda*.",
  "que haces":        "🤖 Te ayudo con todo sobre la Jornada Académica:\n📋 Tu agenda\n🎟️ Tu ticket/QR\n⭐ Tus asistencias\n📍 Ubicaciones\n❓ Dudas generales\n\nEscribe *ayuda* para más detalles.",
  "que puedes hacer":  "🤖 Puedo ayudarte con:\n📋 *mi agenda* → tus sesiones\n🎟️ *ticket* → tu QR de acceso\n⭐ *asistencias* → tu progreso\n❓ */pregunta* → preguntar al ponente\n📍 Ubicaciones e info general\n\n¡Prueba escribiendo cualquiera!",
  "para que sirves":   "🤖 Soy tu guía durante la Jornada UESSJR. Puedo mostrarte tu agenda, ticket, asistencias y responder dudas sobre el evento.\n\nEscribe *ayuda* para ver la lista completa.",
  // ── Agradecimientos especiales ──
  "eres genial":      "¡Gracias! 🤖✨ Solo hago mi trabajo. ¿Necesitas algo más?",
  "me gusta el bot":  "¡Qué bueno que te gusta! 🤖❤️ Si tienes sugerencias, cuéntanos.",
  "buen bot":         "¡Gracias! 🤖😊 Aquí para servirte.",
  // ── Web / Link ──
  "web":              `🌐 Puedes acceder a la plataforma en:\n${APP_URL}\n\nDesde ahí puedes inscribirte, ver tu agenda y más.`,
  "pagina":           `🌐 La página de la jornada es:\n${APP_URL}`,
  "link":             `🔗 Aquí está el link de la plataforma:\n${APP_URL}`,
  "url":              `🔗 ${APP_URL}`,
};

// =============================================
// DETECCIÓN DE INTENCIÓN POR PALABRAS CLAVE
// Cada intención tiene: palabras clave, y una función o respuesta
// =============================================
interface Intencion {
  palabras: string[];          // Alguna de estas palabras debe estar
  requiereAlumno: boolean;     // ¿Necesita que el alumno esté vinculado?
  tipo: "datos" | "estatico";  // "datos" = consulta DB, "estatico" = texto fijo
  respuesta?: string;          // Solo si tipo === "estatico"
}

const INTENCIONES: Record<string, Intencion> = {
  agenda: {
    palabras: ["agenda", "sesion", "sesiones", "taller", "talleres", "conferencia", "conferencias", "horario", "horarios", "siguiente", "proxima", "hoy", "manana", "programa", "actividades", "actividad", "itinerario", "calendario", "que hay"],
    requiereAlumno: true,
    tipo: "datos",
  },
  asistencia: {
    palabras: ["asistencia", "asistencias", "cuantas llevo", "cuantas tengo", "faltan", "progreso", "avance"],
    requiereAlumno: true,
    tipo: "datos",
  },
  certificado: {
    palabras: ["certificado", "constancia", "diploma", "reconocimiento", "certificados", "constancias"],
    requiereAlumno: true,
    tipo: "datos",
  },
  ticket: {
    palabras: ["ticket", "qr", "codigo", "pase", "boleto", "entrada", "mi pase", "mi ticket", "mi qr"],
    requiereAlumno: true,
    tipo: "datos",
  },
  inscripcion: {
    palabras: ["inscribir", "inscribirme", "inscripcion", "registrar", "registrarme", "registro", "anotarme", "apuntarme", "como me inscribo", "cupo"],
    requiereAlumno: false,
    tipo: "estatico",
    respuesta: `📝 *¿Cómo inscribirte?*\n\n1️⃣ Entra a ${APP_URL}\n2️⃣ Inicia sesión con tu cuenta\n3️⃣ Busca la sesión que te interese\n4️⃣ Haz clic en "Inscribirse"\n\n⚠️ El sistema evita traslapes de horario automáticamente.\n👥 Cada sesión tiene cupo limitado, ¡inscríbete pronto!`,
  },
  lugar: {
    palabras: ["donde", "ubicacion", "lugar", "salon", "escenario", "mapa", "direccion", "como llego", "como llegar"],
    requiereAlumno: false,
    tipo: "estatico",
    respuesta: "📍 La jornada se realiza en las instalaciones de la UESSJR. Cada sesión tiene su escenario asignado.\n\nSi ya vinculaste tu cuenta, escribe *mi agenda* para ver los lugares de tus sesiones. También puedes preguntar por un lugar específico (ej: _¿dónde están los baños?_).",
  },
  banos: {
    palabras: ["bano", "banos", "sanitario", "sanitarios", "restroom", "wc"],
    requiereAlumno: false,
    tipo: "estatico",
    respuesta: "🚻 Los baños se encuentran en el edificio principal de la UESSJR. Pregunta al Staff si necesitas indicaciones más específicas.",
  },
  comida: {
    palabras: ["comer", "comida", "cafeteria", "cafe", "alimento", "desayuno", "almuerzo", "tienda", "botana", "agua", "bebida"],
    requiereAlumno: false,
    tipo: "estatico",
    respuesta: "🍽️ Puedes encontrar opciones de comida en la cafetería de la UESSJR y en los alrededores del campus.\n\nPregunta al Staff por las opciones disponibles durante la jornada.",
  },
  estacionamiento: {
    palabras: ["estacionamiento", "estacionar", "carro", "coche", "auto", "parqueo", "parking"],
    requiereAlumno: false,
    tipo: "estatico",
    respuesta: "🅿️ Sí, hay estacionamiento disponible en las instalaciones de la UESSJR. Te recomendamos llegar temprano para encontrar lugar.",
  },
  wifi: {
    palabras: ["wifi", "internet", "red", "conexion", "datos", "contrasena wifi"],
    requiereAlumno: false,
    tipo: "estatico",
    respuesta: "📶 Para información sobre WiFi disponible durante la jornada, pregunta al Staff en la mesa de registro.",
  },
  contacto: {
    palabras: ["staff", "contacto", "contactar", "ayuda presencial", "organizador", "responsable", "encargado", "coordinador", "soporte", "mesa de registro"],
    requiereAlumno: false,
    tipo: "estatico",
    respuesta: "📞 *¿Necesitas ayuda presencial?*\n\nPuedes contactar al Staff del evento:\n• 🏢 En la mesa de registro\n• 👩‍🏫 Con los organizadores de tu carrera\n\n¡Estamos para ayudarte!",
  },
  vincular: {
    palabras: ["vincular", "enlazar", "conectar", "asociar", "como vinculo", "vincular telegram", "enlazar telegram"],
    requiereAlumno: false,
    tipo: "estatico",
    respuesta: `🔗 *¿Cómo vincular tu Telegram?*\n\n1️⃣ Entra a ${APP_URL}\n2️⃣ Inicia sesión con tu cuenta\n3️⃣ Busca el botón azul "Vincular Telegram"\n4️⃣ Te redirigirá aquí automáticamente\n\n¡Listo! Recibirás notificaciones y podrás consultar tu agenda.`,
  },
  problema_web: {
    palabras: ["no puedo entrar", "no carga", "error", "falla", "no funciona", "pagina no", "no abre", "no jala"],
    requiereAlumno: false,
    tipo: "estatico",
    respuesta: `🌐 *¿Problemas con la web?*\n\nIntenta lo siguiente:\n1️⃣ Verifica tu conexión a internet\n2️⃣ Usa el link directo: ${APP_URL}\n3️⃣ Prueba con otro navegador\n4️⃣ Limpia el caché del navegador\n\nSi el problema persiste, contacta al Staff.`,
  },
  contrasena: {
    palabras: ["contrasena", "password", "olvide mi", "no recuerdo", "recuperar cuenta", "no puedo entrar a mi cuenta"],
    requiereAlumno: false,
    tipo: "estatico",
    respuesta: '🔑 Puedes recuperar tu contraseña desde la página de inicio de sesión.\n\nBusca el link "¿Olvidaste tu contraseña?" y sigue las instrucciones.\n\nSi sigues con problemas, contacta al Staff.',
  },
  notificaciones: {
    palabras: ["notificacion", "notificaciones", "no me llegan", "no recibo", "aviso", "avisos", "mensaje", "mensajes no"],
    requiereAlumno: false,
    tipo: "estatico",
    respuesta: "🔔 *¿No te llegan notificaciones?*\n\nVerifica que:\n1️⃣ Tu cuenta de Telegram esté vinculada correctamente\n2️⃣ No hayas bloqueado al bot\n3️⃣ Tu cuenta web esté activa\n\nSi estás leyendo esto, ¡la conexión con el bot funciona! ✅",
  },
  jornada_info: {
    palabras: ["que es la jornada", "de que trata", "de que se trata", "informacion", "sobre la jornada", "sobre el evento", "evento"],
    requiereAlumno: false,
    tipo: "estatico",
    respuesta: "📚 *Jornada Académica y Cultural UESSJR*\n\nEs un evento organizado por la Unidad de Estudios Superiores San José del Rincón. Incluye conferencias, talleres y actividades culturales para los estudiantes.\n\n🌐 Consulta toda la info en: " + APP_URL,
  },
  organizador: {
    palabras: ["quien organiza", "quien hizo", "quien creo", "organizadores"],
    requiereAlumno: false,
    tipo: "estatico",
    respuesta: "🏛️ La Jornada Académica y Cultural es organizada por la *Unidad de Estudios Superiores San José del Rincón* (UESSJR).",
  },
  cambiar_sesion: {
    palabras: ["cambiar sesion", "cambiar taller", "cambiarme", "cancelar inscripcion", "darme de baja", "salirme"],
    requiereAlumno: false,
    tipo: "estatico",
    respuesta: "🔄 Sí, puedes cancelar tu inscripción actual y registrarte en otra sesión desde la plataforma web, siempre y cuando:\n\n✅ Haya cupo disponible\n✅ No se traslape con tus otros horarios\n\n🌐 Hazlo desde: " + APP_URL,
  },
};

// =============================================
// FUNCIÓN PRINCIPAL DE RESPUESTA LOCAL
// =============================================
async function responderLocal(chatId: string | number, text: string) {
  console.log(`[Bot] Procesando: "${text}" | chatId: ${chatId}`);
  if (!text || text.length < 2) return;

  // Indicador de "escribiendo..."
  enviarTyping(chatId);

  const textoNorm = normalizarTexto(text);
  
  // ──────────────────────────────────
  // PASO 1: Comando /ayuda
  // ──────────────────────────────────
  if (textoNorm === "ayuda" || textoNorm === "help" || textoNorm === "ayuda" || textoNorm.startsWith("/ayuda")) {
    await enviarTelegram(chatId, "🤖 *Asistente Virtual UESSJR*\n\nEscribe cualquiera de estas opciones:\n\n📋 *mi agenda* → tus sesiones inscritas\n🎟️ *ticket* → tu código QR de acceso\n⭐ *asistencias* → cuántas llevas\n📝 *inscribirme* → cómo inscribirte\n📍 *baños* / *cafetería* → ubicaciones\n🔗 *vincular* → cómo enlazar Telegram\n🌐 *web* → link de la plataforma\n❓ */pregunta [tu duda]* → preguntar al ponente\n\nO pregúntame lo que necesites sobre la jornada. 😊");
    return;
  }

  // ──────────────────────────────────
  // PASO 2: Respuestas exactas (saludos, despedidas, etc.)
  // ──────────────────────────────────
  const respExacta = RESPUESTAS_EXACTAS[textoNorm];
  if (respExacta) {
    await enviarTelegram(chatId, respExacta);
    return;
  }

  // ──────────────────────────────────
  // PASO 3: Inicializar Supabase
  // ──────────────────────────────────
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ""
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""
  const groqKey = Deno.env.get('GROQ_API_KEY') || ""
  if (!supabaseUrl || !supabaseKey) return;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Identificar alumno
  const { data: estudiante } = await supabase
    .from('estudiantes')
    .select('id, nombre, apellidos, matricula')
    .eq('telegram_chat_id', String(chatId))
    .maybeSingle();

  // ──────────────────────────────────
  // PASO 4: Comando /pregunta al ponente
  // ──────────────────────────────────
  if (textoNorm.startsWith("pregunta ") || textoNorm.startsWith("/pregunta ")) {
    if (!estudiante) {
      await enviarTelegram(chatId, "❌ Para hacer preguntas al ponente, primero vincula tu cuenta desde la plataforma web.");
      return;
    }
    const contenidoPregunta = text.split(/\s+/).slice(1).join(" ");
    if (contenidoPregunta.length < 5) {
      await enviarTelegram(chatId, "⚠️ Por favor escribe una pregunta más detallada.\n\nEjemplo: `/pregunta ¿Cómo funciona la IA en la educación?`");
      return;
    }
    await supabase.from('preguntas_ponentes').insert({
      estudiante_id: estudiante.id,
      pregunta: contenidoPregunta,
      estado: 'pendiente'
    });
    await enviarTelegram(chatId, "✅ Tu pregunta ha sido enviada al moderador. ¡Gracias por participar! 🎤");
    return;
  }

  // ──────────────────────────────────
  // PASO 5: Detectar intención por palabras clave
  // ──────────────────────────────────
  const palabras = textoNorm.split(" ");
  
  for (const [nombre, intencion] of Object.entries(INTENCIONES)) {
    const detectada = intencion.palabras.some(kw => {
      // Si la keyword tiene espacios, buscar como substring
      if (kw.includes(" ")) return textoNorm.includes(kw);
      // Si no, buscar como palabra individual
      return palabras.includes(kw);
    });

    if (!detectada) continue;

    console.log(`[Bot] Intención detectada: ${nombre}`);

    // Si requiere alumno y no está vinculado
    if (intencion.requiereAlumno && !estudiante) {
      await enviarTelegram(chatId, `❌ Para esta consulta necesito que vincules tu cuenta.\n\n🔗 Hazlo desde la web: ${APP_URL}\nBusca el botón azul "Vincular Telegram".`);
      return;
    }

    // Respuesta estática
    if (intencion.tipo === "estatico" && intencion.respuesta) {
      await enviarTelegram(chatId, intencion.respuesta);
      return;
    }

    // Respuestas dinámicas (consultan la DB)
    if (intencion.tipo === "datos" && estudiante) {
      await responderDatos(chatId, nombre, estudiante, supabase);
      return;
    }
  }

  // ──────────────────────────────────
  // PASO 6: Buscar en conocimiento_ia (fuzzy match)
  // ──────────────────────────────────
  const { data: conocimiento } = await supabase.from('conocimiento_ia').select('pregunta, respuesta');

  if (conocimiento && conocimiento.length > 0) {
    const palabrasFiltradas = palabras.filter(p => p.length > 2);
    let mejor = { respuesta: "", puntaje: 0 };

    for (const item of conocimiento) {
      const preguntaNorm = normalizarTexto(item.pregunta);
      const respuestaNorm = normalizarTexto(item.respuesta);
      let puntaje = 0;
      
      for (const palabra of palabrasFiltradas) {
        if (preguntaNorm.includes(palabra)) puntaje += 2;  // Match en pregunta vale doble
        if (respuestaNorm.includes(palabra)) puntaje += 1;  // Match en respuesta también cuenta
      }
      // Bonus fuerte si el texto del usuario está contenido en la pregunta
      if (preguntaNorm.includes(textoNorm)) puntaje += 5;
      
      if (puntaje > mejor.puntaje) {
        mejor = { respuesta: item.respuesta, puntaje };
      }
    }

    if (mejor.puntaje >= 2 && mejor.respuesta) {
      await enviarTelegram(chatId, mejor.respuesta);
      return;
    }
  }

  // ──────────────────────────────────
  // PASO 7: Groq IA (último recurso antes del fallback)
  // ──────────────────────────────────
  if (groqKey) {
    try {
      const contextoRelevante = conocimiento
        ?.map(item => {
          const pNorm = normalizarTexto(item.pregunta);
          const palabrasFiltradas = palabras.filter(p => p.length > 2);
          let score = 0;
          for (const p of palabrasFiltradas) {
            if (pNorm.includes(p)) score++;
          }
          return { ...item, score };
        })
        .filter(i => i.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(c => `- ${c.pregunta}: ${c.respuesta}`)
        .join("\n") || "";

      const nombreAlumno = estudiante ? `${estudiante.nombre} ${estudiante.apellidos}` : "";

      const respuestaIA = await llamarGroq(groqKey, text, nombreAlumno, contextoRelevante);
      if (respuestaIA) {
        await enviarTelegram(chatId, respuestaIA);
        return;
      }
    } catch (err) {
      console.error("[Groq] Error:", err);
    }
  }

  // ──────────────────────────────────
  // PASO 8: Respuesta por defecto
  // ──────────────────────────────────
  await enviarTelegram(chatId, "🤔 No tengo información sobre eso, pero puedo ayudarte con:\n\n📋 *mi agenda* → tus sesiones\n🎟️ *ticket* → tu QR\n⭐ *asistencias* → tu progreso\n📍 Ubicaciones e info del evento\n\nEscribe *ayuda* para ver todas las opciones o contacta al *Staff* presencialmente. 🏛️");
}

// =============================================
// CONSULTAS DINÁMICAS A LA BASE DE DATOS
// =============================================
async function responderDatos(
  chatId: string | number, 
  tipo: string, 
  estudiante: { id: string; nombre: string; apellidos: string; matricula: string },
  supabase: any
) {
  switch (tipo) {
    case "agenda": {
      const [{ data: sesiones }, { data: misInscripciones }] = await Promise.all([
        supabase.from('sesiones').select('id, nombre, hora_inicio, hora_fin, escenarios(nombre), dias_jornada(nombre_dia)').eq('estado', 'activa'),
        supabase.from('inscripciones').select('sesion_id, estado').eq('estudiante_id', estudiante.id),
      ]);

      const inscritas = sesiones?.filter((s: any) => misInscripciones?.some((i: any) => i.sesion_id === s.id && i.estado === 'confirmada'));
      
      if (inscritas && inscritas.length > 0) {
        let msg = `📋 *Tu agenda, ${estudiante.nombre}:*\n\n`;
        for (const s of inscritas) {
          msg += `🕒 ${s.hora_inicio?.slice(0, 5)}${s.hora_fin ? ' - ' + s.hora_fin.slice(0, 5) : ''} | *${s.nombre}*\n📍 ${s.escenarios?.nombre || 'Por definir'} | 📅 ${s.dias_jornada?.nombre_dia || ''}\n\n`;
        }
        msg += `_Total: ${inscritas.length} sesión(es)_`;
        await enviarTelegram(chatId, msg);
      } else {
        await enviarTelegram(chatId, `📋 *${estudiante.nombre}*, aún no tienes sesiones inscritas.\n\n📝 Inscríbete desde la web:\n${APP_URL}`);
      }
      break;
    }

    case "asistencia":
    case "certificado": {
      const { data: misAsistencias } = await supabase
        .from('asistencias')
        .select('sesion_id')
        .eq('estudiante_id', estudiante.id);

      const total = misAsistencias?.length || 0;
      let msg = `📊 *Tus asistencias, ${estudiante.nombre}:*\n\n`;
      msg += `✅ Llevas *${total}* asistencia(s) registrada(s).\n\n`;
      
      if (tipo === "certificado") {
        msg += "🏆 Las constancias se generan automáticamente cuando cumples con tus asistencias. Sigue asistiendo a tus sesiones inscritas.";
      } else {
        msg += "💡 Recuerda asistir a tus sesiones inscritas para obtener tu certificado.";
      }
      await enviarTelegram(chatId, msg);
      break;
    }

    case "ticket": {
      const ticketLink = `${APP_URL}/ticket/${estudiante.id}`;
      await enviarTelegram(chatId, `🎟️ *Tu Ticket Digital, ${estudiante.nombre}:*\n\n${ticketLink}\n\n📌 Presenta este código QR al llegar a tus sesiones.`);
      break;
    }
  }
}

// =============================================
// GROQ API (Llama 3 — rápido y gratuito)
// =============================================
async function llamarGroq(apiKey: string, pregunta: string, nombreAlumno: string, contexto: string): Promise<string | null> {
  try {
    console.log(`[Groq] Enviando pregunta: "${pregunta.slice(0, 80)}..."`);
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `Eres el asistente virtual de la Jornada Académica UESSJR (Unidad de Estudios Superiores San José del Rincón). Responde en español, amable, breve (máximo 3 oraciones), con emojis. Si no sabes algo, di que contacten al Staff. No inventes datos.${nombreAlumno ? ` El alumno se llama ${nombreAlumno}.` : ""}${contexto ? `\n\nInformación disponible:\n${contexto}` : ""}`
          },
          {
            role: "user",
            content: pregunta
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Groq API Error] Status: ${response.status}`, errorText);
      return null;
    }

    const data = await response.json();
    const respuesta = data.choices?.[0]?.message?.content || null;
    console.log(`[Groq] Respuesta: ${respuesta?.length || 0} chars`);
    return respuesta;
  } catch (err) {
    console.error("[Groq] Error en fetch:", err);
    return null;
  }
}

// =============================================
// TELEGRAM HELPERS
// =============================================
function enviarTyping(chatId: string | number) {
  if (!TELEGRAM_TOKEN) return;
  fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  }).catch(() => {});
}

async function enviarTelegram(chatId: string | number, texto: string) {
  if (!TELEGRAM_TOKEN) {
    console.error("⚠️ Falta la variable de entorno TELEGRAM_BOT_TOKEN")
    return
  }
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`
  console.log(`Enviando mensaje a chat_id: ${chatId}`)
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: texto,
      parse_mode: "Markdown",
    }),
  })
  if (!response.ok) {
    const err = await response.text()
    console.error("Error enviando a Telegram:", err)
  } else {
    console.log("✅ Mensaje enviado exitosamente")
  }
}

async function vincularTelegram(studentId: string, chatId: number | string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ""
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""

  if (!supabaseUrl || !supabaseKey) {
    console.error("Faltan variables de Supabase")
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const { error } = await supabase
    .from('estudiantes')
    .update({ telegram_chat_id: String(chatId) })
    .eq('id', studentId)

  if (error) {
    console.error("Error actualizando en Supabase:", error.message)
    throw error
  }
  console.log(`✅ Estudiante ${studentId} enlazado con Chat ID ${chatId}`)
}

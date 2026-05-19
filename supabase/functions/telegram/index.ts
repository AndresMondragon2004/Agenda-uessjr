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
      // Validar autenticación: el frontend envía el JWT automáticamente
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        })
      }

      // Verificar que el JWT es válido usando Supabase Auth
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || ""
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ""
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      })
      const { data: userData, error: authError } = await supabaseClient.auth.getUser()
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
    // CASO B: Webhook entrante desde la API de Telegram (El usuario escribe /start)
    // No requiere JWT — Telegram no tiene forma de enviarlo
    // ==========================================
    if (data.message) {
      const chatId = data.message.chat.id
      const text = data.message.text || ""
      const firstName = data.message.from?.first_name || "estudiante"

      console.log(`Webhook de Telegram: chat_id=${chatId}, text="${text}"`)

      // El usuario entra por el link t.me/agendauessjrbot?start=USER_ID
      if (text.startsWith("/start ")) {
        const studentId = text.split(" ")[1]
        
        console.log(`Vinculando estudiante ${studentId} con chat_id ${chatId}`)
        await vincularTelegram(studentId, chatId)
        
        const welcomeMsg = `¡Conexión exitosa! 🎉\n\nHola ${firstName}, ya he enlazado tu cuenta. A partir de ahora recibirás aquí tus tickets y avisos de la jornada.\n\n¡Bienvenido(a)! 🎓`
        await enviarTelegram(chatId, welcomeMsg)
        
        // Enviar también el ticket
        const ticketLink = `${APP_URL}/ticket/${studentId}`
        await enviarTelegram(chatId, `🎟️ *Tu Ticket Digital (QR de acceso):*\n${ticketLink}\n\n📌 Preséntalo al llegar a tus sesiones.`)
      } 
      else if (text === "/start") {
        await enviarTelegram(chatId, "Hola 👋. Para vincular tu cuenta, por favor usa el botón azul 'Vincular Telegram' desde la página de tu Agenda en la web. 🌐")
      }
      else {
        // Cualquier otro mensaje — respuesta genérica
        await enviarTelegram(chatId, "Hola 👋. Soy el bot de la Jornada Académica UES SJR. Si necesitas ayuda, visita la web de la agenda.")
      }
      
      // Siempre debemos responder 200 OK a Telegram
      return new Response('OK', { headers: corsHeaders, status: 200 })
    }

    // Si llega otra cosa
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

// Función auxiliar para enviar mensajes a Telegram
async function enviarTelegram(chatId: string | number, texto: string) {
  if (!TELEGRAM_TOKEN) {
    console.error("⚠️ Falta la variable de entorno TELEGRAM_BOT_TOKEN")
    return
  }
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`
  console.log(`Enviando mensaje a chat_id: ${chatId}`)
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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

// Función auxiliar para guardar el chatId en Supabase usando el Service Role
async function vincularTelegram(studentId: string, chatId: number | string) {
  // En las edge functions, SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY están disponibles automáticamente
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

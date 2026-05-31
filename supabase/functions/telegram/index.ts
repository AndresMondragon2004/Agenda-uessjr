import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || ""
const APP_URL = "https://agenda-uessjr.vercel.app"

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const data = await req.json()

    if (data.type === 'TELEGRAM') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) return new Response('No autorizado', { status: 401, headers: corsHeaders })
      const token = authHeader.replace('Bearer ', '')
      const supabase = createClient(Deno.env.get('SUPABASE_URL') || "", Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || "")
      const { data: userData } = await supabase.auth.getUser(token)
      if (!userData?.user) return new Response('Token inválido', { status: 401, headers: corsHeaders })
      await enviarTelegram(data.to, data.message)
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })
    }

    if (data.message) {
      const chatId = data.message.chat.id
      const text = data.message.text || ""
      const firstName = data.message.from?.first_name || "estudiante"

      if (text.startsWith("/start ")) {
        const studentId = text.split(" ")[1]
        await vincularTelegram(studentId, chatId)
        await enviarTelegram(chatId, `¡Conexión exitosa! 🎉\n\nHola ${firstName}, ya he enlazado tu cuenta. Estás listo para vivir la jornada al máximo. 🎓`)
        await enviarTelegram(chatId, `🎟️ *Tu Ticket Digital:*\n${APP_URL}/ticket/${studentId}`)
      } 
      else if (text === "/start") {
        await enviarTelegram(chatId, "Hola 👋. Para vincular tu cuenta, usa el botón 'Vincular Telegram' en la web. 🌐")
      }
      else if (/^[1-5]$/.test(text.trim())) {
        await manejarFeedback(chatId, text.trim())
      }
      else {
        await responderLocal(chatId, text)
      }
      return new Response('OK', { status: 200 })
    }

    return new Response('Payload no reconocido', { status: 400 })
  } catch (error) {
    return new Response(error.message, { status: 500 })
  }
})

// =============================================
// FUNCIÓN PRINCIPAL DE RESPUESTA LOCAL (CONCIERGE AI)
// =============================================
async function responderLocal(chatId: string | number, text: string) {
  if (!text || text.length < 2) return
  enviarTyping(chatId)

  const supabase = createClient(Deno.env.get('SUPABASE_URL') || "", Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || "")
  const groqKey = Deno.env.get('GROQ_API_KEY') || ""

  // 1. Identificar Alumno y sus inscripciones
  const { data: estudiante } = await supabase
    .from('estudiantes')
    .select('id, nombre, apellidos, matricula, programa_academico')
    .eq('telegram_chat_id', String(chatId))
    .maybeSingle()

  const { data: misInscripciones } = estudiante 
    ? await supabase.from('inscripciones').select('sesiones(nombre, hora_inicio, escenarios(nombre))').eq('estudiante_id', estudiante.id).eq('estado', 'confirmada')
    : { data: [] }

  // 2. Comando /pregunta (Manual para asegurar rapidez)
  if (text.toLowerCase().startsWith("/pregunta ")) {
    if (!estudiante) return await enviarTelegram(chatId, "❌ Vincula tu cuenta en la web para hacer preguntas al ponente.")
    const preg = text.split(/\s+/).slice(1).join(" ")
    await supabase.from('preguntas_ponentes').insert({ estudiante_id: estudiante.id, pregunta: preg })
    return await enviarTelegram(chatId, "✅ Tu pregunta ha sido enviada al moderador. ¡Gracias! 🎤")
  }

  // 3. Obtener Contexto Global
  const [{ data: sesiones }, { data: conocimiento }] = await Promise.all([
    supabase.from('sesiones').select('nombre, tipo, hora_inicio, hora_fin, ponente_nombre, escenarios(nombre), dias_jornada(nombre_dia, fecha)').eq('estado', 'activa'),
    supabase.from('conocimiento_ia').select('pregunta, respuesta')
  ])

  const ahora = new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" })
  const sesionesT = (sesiones || []).map(s => `- ${s.nombre} (${s.tipo}) con ${s.ponente_nombre}. ${s.hora_inicio?.slice(0,5)} en ${s.escenarios?.nombre}. Día: ${s.dias_jornada?.nombre_dia}`).join("\n")
  const kbT = (conocimiento || []).map(k => `- P: ${k.pregunta} | R: ${k.respuesta}`).join("\n")
  const inscT = (misInscripciones || []).map((i: any) => `- ${i.sesiones.nombre} a las ${i.sesiones.hora_inicio?.slice(0,5)} en ${i.sesiones.escenarios?.nombre}`).join("\n")

  const prompt = `Eres el Concierge Inteligente de la Jornada UESSJR. 
Tu estilo es: Amable, humano, con emojis, breve (3-4 oraciones).

CONTEXTO DEL CAMPUS:
- Hora local: ${ahora}
- Sesiones HOY/MAÑANA:\n${sesionesT.slice(0, 2500)}
- FAQ:\n${kbT.slice(0, 1000)}

DATOS DEL USUARIO:
${estudiante ? `- Alumno: ${estudiante.nombre} (${estudiante.programa_academico})
- Ticket Link: ${APP_URL}/ticket/${estudiante.id}
- Su Agenda Inscrita:\n${inscT || "Sin sesiones inscritas aún"}` : "- Usuario no vinculado"}

REGLAS CRÍTICAS:
1. Si piden su TICKET o QR, dales el link directamente en tu respuesta de forma amable.
2. Si preguntan por su agenda o qué sigue, usa los datos de "Su Agenda Inscrita".
3. Si preguntan recomendaciones, usa la lista general de sesiones y relaciónalas con su carrera si es posible.
4. Si NO está vinculado, invítalo a usar el botón azul de la web.
5. Usa [AGENDA] o [ASISTENCIAS] al final solo si quieres que el sistema mande el listado técnico adicional.`;

  try {
    const aiResp = await llamarGroq(groqKey, text, prompt)
    if (!aiResp) return await enviarTelegram(chatId, "Huy, me distraje. ¿Me repites? 😅")

    let finalMsg = aiResp
    let matchedType = null

    if (aiResp.includes("[AGENDA]")) { finalMsg = aiResp.replace("[AGENDA]", "").trim(); matchedType = "agenda"; }
    else if (aiResp.includes("[ASISTENCIAS]")) { finalMsg = aiResp.replace("[ASISTENCIAS]", "").trim(); matchedType = "asistencia"; }

    await enviarTelegram(chatId, finalMsg)
    if (matchedType && estudiante) await responderDatos(chatId, matchedType, estudiante, supabase)

  } catch (e) {
    await enviarTelegram(chatId, "Estoy procesando mucha info, intenta en un momento. 🧠")
  }
}

async function responderDatos(chatId: string | number, tipo: string, estudiante: any, supabase: any) {
  if (tipo === "agenda") {
    const { data: insc } = await supabase.from('inscripciones').select('sesiones(nombre, hora_inicio, escenarios(nombre))').eq('estudiante_id', estudiante.id).eq('estado', 'confirmada')
    if (!insc?.length) return await enviarTelegram(chatId, "Aún no tienes sesiones en tu agenda. 📅")
    let msg = `📋 *Resumen técnico de tu agenda:*\n\n`
    insc.forEach((i: any) => msg += `🕒 ${i.sesiones.hora_inicio?.slice(0,5)} | *${i.sesiones.nombre}*\n📍 ${i.sesiones.escenarios?.nombre}\n\n`)
    await enviarTelegram(chatId, msg)
  }
  else if (tipo === "asistencia") {
    const { data: asist } = await supabase.from('asistencias').select('id').eq('estudiante_id', estudiante.id)
    const total = asist?.length || 0
    await enviarTelegram(chatId, `📊 Llevas *${total}* asistencias verificadas. ${total >= 6 ? "¡Excelente! Ya puedes bajar tu constancia. 🏆" : `Te faltan ${6-total} para el mínimo. 💪`}`)
  }
}

async function llamarGroq(apiKey: string, query: string, prompt: string) {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "system", content: prompt }, { role: "user", content: query }],
      temperature: 0.6, max_tokens: 500
    })
  })
  const d = await r.json()
  return d.choices?.[0]?.message?.content || null
}

async function manejarFeedback(chatId: any, calif: string) {
  const supabase = createClient(Deno.env.get('SUPABASE_URL') || "", Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || "")
  const { data: est } = await supabase.from('estudiantes').select('id').eq('telegram_chat_id', String(chatId)).maybeSingle()
  if (!est) return
  const { data: log } = await supabase.from('telegram_reminders_log').select('sesion_id').eq('estudiante_id', est.id).eq('tipo', 'feedback').order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (!log) return
  await supabase.from('feedback_sesiones').upsert({ estudiante_id: est.id, sesion_id: log.sesion_id, calificacion: parseInt(calif) })
  await enviarTelegram(chatId, "¡Gracias por tu calificación! ⭐")
}

function enviarTyping(chatId: any) {
  fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  }).catch(() => {})
}

async function enviarTelegram(chatId: any, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown", disable_web_page_preview: false }),
  })
}

async function vincularTelegram(studentId: string, chatId: any) {
  const supabase = createClient(Deno.env.get('SUPABASE_URL') || "", Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || "")
  await supabase.from('estudiantes').update({ telegram_chat_id: String(chatId) }).eq('id', studentId)
}

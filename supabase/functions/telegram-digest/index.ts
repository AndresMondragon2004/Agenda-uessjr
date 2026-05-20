import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || ""

serve(async (req) => {
  try {
    const cronSecret = req.headers.get('x-cron-secret')
    const envSecret = Deno.env.get('CRON_SECRET')
    if (envSecret && cronSecret !== envSecret) {
      return new Response("Unauthorized", { status: 401 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ""
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get Mexico City date
    const now = new Date()
    const mxFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Mexico_City',
      year: 'numeric', month: '2-digit', day: '2-digit'
    })
    const parts = mxFormatter.formatToParts(now)
    const mxObj: any = {}
    parts.forEach(p => mxObj[p.type] = p.value)
    const todayStr = `${mxObj.year}-${mxObj.month}-${mxObj.day}`

    // Get today's active schedule
    const { data: diaJornada } = await supabase
      .from('dias_jornada')
      .select('id, nombre_dia, jornadas!inner(estado)')
      .eq('fecha', todayStr)
      .eq('jornadas.estado', 'activa')
      .maybeSingle()

    if (!diaJornada) {
      return new Response("No active event today", { status: 200 })
    }

    // Get all sessions for today
    const { data: sesiones } = await supabase
      .from('sesiones')
      .select('id, nombre, hora_inicio, escenarios(nombre)')
      .eq('dia_jornada_id', diaJornada.id)
      .eq('estado', 'activa')
      .order('hora_inicio')

    if (!sesiones || sesiones.length === 0) {
       return new Response("No sessions today", { status: 200 })
    }

    // Get all students with telegram
    const { data: estudiantes } = await supabase
      .from('estudiantes')
      .select('id, nombre, telegram_chat_id')
      .not('telegram_chat_id', 'is', null)

    for (const est of (estudiantes || [])) {
      // Get enrolled sessions for this student today
      const { data: inscripciones } = await supabase
        .from('inscripciones')
        .select('sesion_id')
        .eq('estudiante_id', est.id)
        .eq('estado', 'confirmada')
      
      const sesionIds = (inscripciones || []).map(i => i.sesion_id)
      const misSesiones = sesiones.filter(s => sesionIds.includes(s.id))

      if (misSesiones.length > 0) {
        let msg = `☀️ ¡Buenos días ${est.nombre}!\n\nHoy tienes ${misSesiones.length} sesiones programadas:\n\n`
        for (const s of misSesiones) {
          msg += `🕒 ${s.hora_inicio?.slice(0,5)} | ${s.nombre}\n📍 ${s.escenarios?.nombre || 'General'}\n\n`
        }
        msg += `¡Que tengas un excelente día! 🚀`

        await enviarTelegram(est.telegram_chat_id, msg)
        await new Promise(r => setTimeout(r, 50)) // rate limit
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})

async function enviarTelegram(chatId: string | number, texto: string) {
  if (!TELEGRAM_TOKEN) return
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: texto }),
  })
}

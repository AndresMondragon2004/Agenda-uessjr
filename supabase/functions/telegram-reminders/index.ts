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

    // Get Mexico City time
    const now = new Date()
    const mxFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Mexico_City',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    })
    
    const mxParts = mxFormatter.formatToParts(now)
    const mxObj: any = {}
    mxParts.forEach(p => mxObj[p.type] = p.value)
    
    const todayStr = `${mxObj.year}-${mxObj.month}-${mxObj.day}`
    const nowHrs = parseInt(mxObj.hour)
    const nowMins = parseInt(mxObj.minute)

    // Feature 1: Reminders 10 mins before
    let targetMins = nowMins + 10
    let targetHrs = nowHrs
    if (targetMins >= 60) {
      targetMins -= 60
      targetHrs += 1
    }
    const hhmm_target = `${String(targetHrs).padStart(2, '0')}:${String(targetMins).padStart(2, '0')}:00`
    const hhmm_now = `${String(nowHrs).padStart(2, '0')}:${String(nowMins).padStart(2, '0')}:00`

    const { data: sesionesProximas } = await supabase
      .from('sesiones')
      .select('*, dias_jornada!inner(fecha), escenarios(nombre)')
      .eq('estado', 'activa')
      .eq('dias_jornada.fecha', todayStr)
      .gte('hora_inicio', hhmm_now)
      .lte('hora_inicio', hhmm_target)

    for (const sesion of (sesionesProximas || [])) {
      const { data: inscritos } = await supabase
        .from('inscripciones')
        .select('estudiante_id, estudiantes!inner(telegram_chat_id)')
        .eq('sesion_id', sesion.id)
        .eq('estado', 'confirmada')
      
      for (const insc of (inscritos || [])) {
        if (!insc.estudiantes?.telegram_chat_id) continue;
        
        const { data: log } = await supabase
          .from('telegram_reminders_log')
          .select('id')
          .eq('sesion_id', sesion.id)
          .eq('estudiante_id', insc.estudiante_id)
          .eq('tipo', 'reminder_10min')
          .maybeSingle()
          
        if (!log) {
          const msg = `⏰ ¡Tu sesión '${sesion.nombre}' comienza pronto!\n\n📍 Lugar: ${sesion.escenarios?.nombre || 'General'}\n🕐 Hora: ${sesion.hora_inicio.slice(0,5)}\n\n¡No llegues tarde! 🏃`
          await enviarTelegram(insc.estudiantes.telegram_chat_id, msg)
          
          await supabase.from('telegram_reminders_log').insert({
            sesion_id: sesion.id,
            estudiante_id: insc.estudiante_id,
            tipo: 'reminder_10min'
          })
          
          await new Promise(r => setTimeout(r, 50)) // rate limit protection
        }
      }
    }

    // Feature 6: Feedback 30 mins after end
    let targetEndMins = nowMins - 30
    let targetEndHrs = nowHrs
    if (targetEndMins < 0) {
      targetEndMins += 60
      targetEndHrs -= 1
    }
    const hhmm_end_target = `${String(targetEndHrs).padStart(2, '0')}:${String(targetEndMins).padStart(2, '0')}:00`

    const { data: sesionesTerminadas } = await supabase
      .from('sesiones')
      .select('*, dias_jornada!inner(fecha)')
      .eq('estado', 'activa')
      .eq('dias_jornada.fecha', todayStr)
      .lte('hora_fin', hhmm_end_target)

    for (const sesion of (sesionesTerminadas || [])) {
      if (!sesion.hora_fin) continue;

      const finHrs = parseInt(sesion.hora_fin.split(':')[0])
      const finMins = parseInt(sesion.hora_fin.split(':')[1])
      const diffMins = (nowHrs * 60 + nowMins) - (finHrs * 60 + finMins)
      if (diffMins > 90 || diffMins < 30) continue; 

      const { data: inscritos } = await supabase
        .from('inscripciones')
        .select('estudiante_id, estudiantes!inner(telegram_chat_id)')
        .eq('sesion_id', sesion.id)
        .eq('estado', 'confirmada')
      
      for (const insc of (inscritos || [])) {
        if (!insc.estudiantes?.telegram_chat_id) continue;
        
        const { data: log } = await supabase
          .from('telegram_reminders_log')
          .select('id')
          .eq('sesion_id', sesion.id)
          .eq('estudiante_id', insc.estudiante_id)
          .eq('tipo', 'feedback')
          .maybeSingle()
          
        if (!log) {
          const msg = `⭐ ¿Qué te pareció '${sesion.nombre}'?\n\nResponde con un número del 1 al 5:\n1️⃣ Mala\n2️⃣ Regular\n3️⃣ Buena\n4️⃣ Muy buena\n5️⃣ Excelente\n\nTu opinión nos ayuda a mejorar 🙏`
          await enviarTelegram(insc.estudiantes.telegram_chat_id, msg)
          
          await supabase.from('telegram_reminders_log').insert({
            sesion_id: sesion.id,
            estudiante_id: insc.estudiante_id,
            tipo: 'feedback'
          })
          
          await new Promise(r => setTimeout(r, 50))
        }
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
    body: JSON.stringify({ chat_id: chatId, text: texto, parse_mode: "Markdown" }),
  })
}

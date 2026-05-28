import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejo de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { mensaje, programa, channels } = await req.json()
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No autorizado')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ""
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""
    const gasUrl = Deno.env.get('GAS_URL') || ""
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || ""
    
    if (!supabaseUrl || !supabaseKey) throw new Error('Faltan variables de entorno de Supabase')

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Verificar identidad del Admin que hace la petición
    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: authError } = await supabase.auth.getUser(token)
    if (authError || !userData?.user) throw new Error('Token inválido o expirado')

    const { data: adminData } = await supabase.from('admins').select('activo').eq('auth_id', userData.user.id).single()
    if (!adminData?.activo) throw new Error('Usuario no es administrador activo')

    // Obtener los destinatarios
    let query = supabase.from('estudiantes').select('id, nombre, correo, telegram_chat_id')
    if (programa !== 'todos') {
      query = query.eq('programa_academico', programa)
    }
    
    const { data: destinatarios, error: destError } = await query
    if (destError) throw destError

    if (!destinatarios || destinatarios.length === 0) {
      return new Response(JSON.stringify({ success: true, count: 0 }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    console.log(`Iniciando envío masivo a ${destinatarios.length} alumnos. Canales:`, channels)

    let enviados = 0
    // Enviar en lotes (batches) de 15 para no saturar las APIs de Google/Telegram
    for (let i = 0; i < destinatarios.length; i += 15) {
      const batch = destinatarios.slice(i, i + 15)
      const promises = []

      for (const est of batch) {
        // Telegram
        if (channels.telegram && est.telegram_chat_id && botToken) {
          promises.push(
            fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                chat_id: est.telegram_chat_id, 
                text: mensaje, 
                parse_mode: 'Markdown' 
              })
            }).catch(e => console.error('Error Telegram API:', e))
          )
        }
        
        // Correo Electrónico (GAS)
        if (channels.email && est.correo && gasUrl) {
          promises.push(
            fetch(gasUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain' },
              body: JSON.stringify({
                to: est.correo,
                subject: 'Aviso Importante: Jornada UESSJR',
                type: 'WELCOME',
                data: {
                  first_name: est.nombre,
                  full_name: est.nombre,
                  mensaje: mensaje
                }
              })
            }).catch(e => console.error('Error GAS API:', e))
          )
        }
      }
      
      await Promise.all(promises)
      enviados += batch.length
      console.log(`Lote completado. Enviados: ${enviados}/${destinatarios.length}`)
    }

    return new Response(JSON.stringify({ success: true, count: enviados }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error en Broadcast:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

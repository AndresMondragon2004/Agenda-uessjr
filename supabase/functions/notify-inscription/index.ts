import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const gasUrl = Deno.env.get("GAS_URL")!; 
const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log("=== WEBHOOK RECIBIDO ===");
    console.log("Payload:", JSON.stringify(payload));
    
    if (payload.table !== "inscripciones") {
      console.log("Ignorado: la tabla no es inscripciones");
      return new Response("Ignorado", { status: 200 });
    }

    let isPromotion = false;

    if (payload.type === "UPDATE") {
      if (payload.old_record?.estado === "lista_espera" && payload.record.estado === "confirmada") {
        isPromotion = true;
        console.log("Detectada promoción de lista de espera a confirmada");
      } else {
        console.log("Ignorado: UPDATE pero no es promoción");
        return new Response("Ignorado, no es promoción de lista de espera", { status: 200 });
      }
    } else if (payload.type !== "INSERT") {
      console.log("Ignorado: no es INSERT ni UPDATE relevante");
      return new Response("Ignorado", { status: 200 });
    }

    const { estudiante_id, sesion_id, estado } = payload.record;

    const { data: estudiante, error: errEst } = await supabase
      .from("estudiantes")
      .select("nombre, correo, telegram_chat_id")
      .eq("id", estudiante_id)
      .single();

    if (errEst || !estudiante) throw new Error("Estudiante no encontrado");

    const { data: sesion, error: errSes } = await supabase
      .from("sesiones")
      .select(`
        nombre, 
        hora_inicio, 
        escenarios (nombre), 
        dias_jornada (nombre_dia)
      `)
      .eq("id", sesion_id)
      .single();

    if (errSes || !sesion) throw new Error("Sesión no encontrada");

    const lugar = sesion.escenarios?.nombre || "Por confirmar";
    const fecha = sesion.dias_jornada?.nombre_dia;
    const hora = sesion.hora_inicio.slice(0, 5);

    let emailSubject = "";
    let emailType = "";
    let telegramMsg = "";

    if (isPromotion) {
      emailSubject = `¡Inscripción Confirmada! ${sesion.nombre}`;
      emailType = "WAITLIST_PROMOTED";
      telegramMsg = `🎉 ¡Buenas noticias, *${estudiante.nombre}*!\n\nSe ha liberado un lugar y tu inscripción para *${sesion.nombre}* ha sido CONFIRMADA. ✅\n\n📍 Lugar: ${lugar}\n📅 Fecha: ${fecha}\n🕒 Hora: ${hora}`;
    } else if (estado === "confirmada") {
      emailSubject = `Confirmación: ${sesion.nombre}`;
      emailType = "SESSION_CONFIRM";
      telegramMsg = `¡Confirmado! ✅ Te has inscrito a: *${sesion.nombre}*.\n\n📅 Fecha: ${fecha}\n🕒 Hora: ${hora}\n📍 Lugar: ${lugar}\n\n¡Te esperamos! 😊`;
    } else {
      emailSubject = `En lista de espera: ${sesion.nombre}`;
      emailType = "WAITLIST_CONFIRMATION";
      telegramMsg = `⏳ Estás en lista de espera para: *${sesion.nombre}*.\n\nTe notificaremos automáticamente si se libera un espacio. 😊`;
    }

    console.log(`Enviando notificaciones para ${estudiante.nombre}...`);

    if (estudiante.correo && gasUrl) {
      console.log("Enviando correo a:", estudiante.correo);
      const resMail = await fetch(gasUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          to: estudiante.correo,
          subject: emailSubject,
          type: "WELCOME", // Forzamos WELCOME porque es la plantilla que sabemos que funciona en tu GAS
          data: {
            first_name: estudiante.nombre,
            full_name: estudiante.nombre,
            mensaje: telegramMsg, // Reutilizamos el texto de Telegram para el cuerpo del correo
            action_url: "https://agenda-uessjr.vercel.app",
            action_text: "Ver mi Agenda"
          },
        }),
      });
      console.log("Respuesta GAS:", resMail.status);
    } else {
      console.log("No se envió correo. Falta correo o GAS_URL.");
    }

    if (estudiante.telegram_chat_id && botToken) {
      console.log("Enviando Telegram a chat_id:", estudiante.telegram_chat_id);
      const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const resTg = await fetch(tgUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: estudiante.telegram_chat_id,
          text: telegramMsg,
          parse_mode: "Markdown",
        }),
      });
      console.log("Respuesta Telegram:", resTg.status);
    } else {
      console.log("No se envió Telegram. Falta chat_id o TELEGRAM_BOT_TOKEN.");
    }

    console.log("=== PROCESO COMPLETADO EXITOSAMENTE ===");
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en Webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

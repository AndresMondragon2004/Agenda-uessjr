const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const preguntas = [
  { pregunta: '¿Dónde están los baños?', respuesta: '🚻 Hay dos baños disponibles: uno en la planta baja, junto a la puerta principal a la izquierda; y otro en la planta alta, subiendo las escaleras.', categoria: 'servicios' },
  { pregunta: '¿Hay WiFi disponible? ¿Cuál es la clave?', respuesta: '📶 No hay Wi-Fi disponible para uso general debido a la cantidad de estudiantes. Sin embargo, si necesitas internet, puedes ir a la sala de cómputo y solicitar acceso a una computadora.', categoria: 'servicios' },
  { pregunta: '¿Dónde puedo comer algo o hay cafetería?', respuesta: '🥪 No hay cafetería dentro de la universidad. Contamos con una máquina expendedora frente a los baños de la planta baja, o bien, puedes comprar alimentos fuera de la unidad.', categoria: 'servicios' },
  { pregunta: '¿Dónde está el Auditorio / Edificio B / Aula Magna?', respuesta: '🏛️ El Aula Magna se encuentra en la planta baja. Frente a él está la sala de cómputo. El resto de las aulas se ubican en la planta alta.', categoria: 'logistica' },
  { pregunta: '¿Hay algún lugar para cargar mi celular?', respuesta: '🔋 Sí, puedes cargar tu celular dentro de la sala de cómputo.', categoria: 'servicios' },
  { pregunta: '¿Cuál es el punto de reunión en caso de emergencia?', respuesta: '🚨 El punto de reunión en caso de emergencia se ubica en la explanada de la unidad.', categoria: 'emergencia' },
  { pregunta: '¿Hay servicio médico y dónde está?', respuesta: '🚑 Sí, si requieres atención médica puedes subir al área administrativa, ubicada al final del pasillo en la planta superior.', categoria: 'emergencia' },
  { pregunta: '¿Cuántas asistencias necesito para la constancia?', respuesta: '📜 Necesitas acumular al menos 6 asistencias a sesiones para poder obtener tu constancia oficial.', categoria: 'reglas' },
  { pregunta: '¿Tiene algún costo el evento o los talleres?', respuesta: '💰 Los eventos generales de la jornada no tienen ningún costo. Sin embargo, algunos talleres están sujetos a los materiales que se soliciten, cuyo costo debe ser cubierto por cada participante.', categoria: 'reglas' },
  { pregunta: '¿Hay algún código de vestimenta?', respuesta: '👕 No, no existe ningún código de vestimenta obligatorio para la jornada.', categoria: 'reglas' },
  { pregunta: '¿Qué pasa si llego tarde a una sesión?', respuesta: '⏰ Tienes 5 minutos de tolerancia. Si llegas tarde, aún podrás ingresar siempre y cuando haya lugares disponibles. Si pasados los 5 minutos no registras tu asistencia, tu lugar se cancelará para permitir el acceso a alguien más.', categoria: 'reglas' },
  { pregunta: '¿Puedo entrar a una sesión si no me inscribí pero hay lugar?', respuesta: '🎟️ Sí, si aún hay lugares disponibles puedes ingresar aunque no te hayas inscrito. Sin embargo, para asegurar tu lugar te recomendamos registrarte en la lista de espera.', categoria: 'reglas' },
  { pregunta: '¿Es obligatorio usar el correo institucional para el registro?', respuesta: '📧 No es obligatorio. Si no cuentas con tu correo institucional, puedes realizar el registro utilizando cualquier correo personal.', categoria: 'reglas' },
  { pregunta: '¿Qué hago si mi QR no abre o no carga?', respuesta: '📱 Si tu QR falla o no carga, acércate a los encargados de tomar la asistencia (Staff) y pídeles que registren tu asistencia manualmente usando tu matrícula.', categoria: 'soporte' },
  { pregunta: 'Perdí mi contraseña, ¿cómo la recupero?', respuesta: '🔑 Puedes recuperarla fácilmente usando el botón de "Olvidé mi contraseña" en la página de inicio de sesión de AgendaUes.', categoria: 'soporte' },
  { pregunta: '¿A quién acudo si tengo problemas con mi inscripción?', respuesta: '💻 Para problemas con tu inscripción u otros inconvenientes con el sistema, por favor acude con el encargado de la sala de cómputo.', categoria: 'soporte' },
  { pregunta: '¿Puedo llevar invitados externos a la universidad?', respuesta: '👥 Sí, puedes llevar invitados. No obstante, toma en cuenta que no se les asegura un lugar en las sesiones a menos que haya espacios disponibles de sobra.', categoria: 'logistica' },
  { pregunta: '¿Puedo dar un taller o conferencia?', respuesta: '🎤 Sí, cualquier persona puede proponer un taller o conferencia. Solo necesitas registrarte en el apartado "Propón una actividad" dentro del sistema web y esperar a que tu solicitud sea revisada y aceptada por la coordinación.', categoria: 'logistica' },
  { pregunta: '¿Qué es la jornada académica?', respuesta: '📚 La Jornada Académica y Cultural es un evento organizado por la Unidad de Estudios Superiores San José del Rincón (UESSJR). Incluye conferencias, talleres y actividades culturales para los estudiantes.', categoria: 'general' },
  { pregunta: '¿Cuándo es la jornada?', respuesta: '📅 Puedes consultar las fechas exactas en tu agenda digital en la web o escríbeme "mi agenda" para ver tus sesiones programadas.', categoria: 'general' },
  { pregunta: '¿Dónde es la jornada?', respuesta: '📍 La jornada se realiza en las instalaciones de la UESSJR (Unidad de Estudios Superiores San José del Rincón). Cada sesión tiene su escenario asignado, escríbeme "mi agenda" para ver los detalles.', categoria: 'general' },
  { pregunta: '¿Cómo me inscribo a una sesión?', respuesta: '📝 Para inscribirte: 1. Entra a la web. 2. Inicia sesión. 3. Busca la sesión. 4. Haz clic en "Inscribirse". El sistema evitará traslapes automáticamente.', categoria: 'general' },
  { pregunta: '¿Puedo cambiar de sesión?', respuesta: '🔄 Sí, puedes cancelar tu inscripción actual y registrarte en otra sesión, siempre y cuando haya cupo disponible y no interfiera con tus otros horarios.', categoria: 'general' },
  { pregunta: '¿Hay cupo limitado?', respuesta: '👥 Sí, cada sesión tiene un cupo máximo. Si se llena, puedes quedar en lista de espera. ¡Inscríbete pronto!', categoria: 'general' },
  { pregunta: 'No puedo inscribirme', respuesta: '🚫 Posibles razones: La sesión ya no tiene cupo, se traslapa con otra sesión tuya, o no has iniciado sesión. Si el problema persiste, contacta al encargado de la sala de cómputo.', categoria: 'soporte' },
  { pregunta: '¿Cómo obtengo mi certificado?', respuesta: '🏆 Las constancias se generan automáticamente cuando cumples las 6 asistencias mínimas. Escríbeme "asistencias" para ver tu progreso.', categoria: 'general' },
  { pregunta: '¿Cómo vinculo mi Telegram?', respuesta: '🔗 Inicia sesión en la plataforma web y busca el botón azul "Vincular Telegram" en tu perfil. Te redirigirá aquí automáticamente.', categoria: 'general' },
  { pregunta: '¿Qué puede hacer este bot?', respuesta: '🤖 Puedo ayudarte con: Ver tu agenda ("mi agenda"), Tu ticket/QR ("ticket"), Tus asistencias ("asistencias"), o enviar dudas al ponente ("/pregunta [duda]"). ¡Pregúntame!', categoria: 'general' },
  { pregunta: 'Hay estacionamiento', respuesta: '🚗 Sí, hay estacionamiento disponible en las instalaciones de la UESSJR. Te recomendamos llegar temprano.', categoria: 'logistica' },
  { pregunta: 'Dónde es el registro', respuesta: '📋 El registro general (check-in) se realiza en la entrada principal. Recuerda tener listo tu código QR.', categoria: 'logistica' },
  { pregunta: 'No me llegan las notificaciones', respuesta: '🔔 Verifica que tu cuenta de Telegram esté vinculada, que no hayas silenciado o bloqueado al bot y que tu cuenta web esté activa. Escríbeme "hola" para probar.', categoria: 'soporte' },
  { pregunta: 'Quién organiza la jornada', respuesta: '🏫 La Jornada Académica y Cultural es organizada por la Unidad de Estudios Superiores San José del Rincón (UESSJR).', categoria: 'general' }
];

async function insertData() {
  for (const item of preguntas) {
    // Check if exists
    const { data: exist } = await supabase.from('conocimiento_ia').select('id').eq('pregunta', item.pregunta).maybeSingle();
    if (!exist) {
      const { error } = await supabase.from('conocimiento_ia').insert([item]);
      if (error) console.error("Error insertando:", item.pregunta, error.message);
      else console.log("Insertado:", item.pregunta);
    } else {
      console.log("Ya existe:", item.pregunta);
    }
  }
}

insertData();

-- =============================================
-- DATOS PARA LA TABLA conocimiento_ia
-- Ejecutar en el SQL Editor de Supabase
-- 
-- NOTA: Estos datos complementan las respuestas
-- del bot. Las respuestas a saludos, agenda personal,
-- ticket, asistencias, etc. ya las maneja el bot
-- directamente. Esto cubre preguntas más específicas.
-- =============================================

-- Limpiamos datos anteriores para evitar duplicados
DELETE FROM conocimiento_ia;

INSERT INTO conocimiento_ia (pregunta, respuesta) VALUES

-- ===== INFORMACIÓN GENERAL DEL EVENTO =====
('que es la jornada academica', 
 '📚 La Jornada Académica y Cultural es un evento organizado por la UESSJR (Unidad de Estudios Superiores San José del Rincón). Incluye conferencias, talleres y actividades culturales para todos los estudiantes.'),

('cuando es la jornada', 
 '📅 Las fechas de la jornada están publicadas en la plataforma web. Escribe *mi agenda* para ver las sesiones a las que estás inscrito.'),

('donde es la jornada', 
 '📍 La jornada se realiza en las instalaciones de la UESSJR. Cada sesión tiene su lugar asignado. Escribe *mi agenda* para ver los escenarios de tus sesiones.'),

('quien organiza la jornada', 
 '🏛️ La Jornada Académica y Cultural es organizada por la Unidad de Estudios Superiores San José del Rincón (UESSJR).'),

('a que hora empieza la jornada', 
 '🕐 El horario depende de las sesiones programadas para cada día. Escribe *mi agenda* para consultar tus horarios.'),

('a que hora termina', 
 '🕐 El horario de cierre depende de la última sesión del día. Consulta los horarios en la plataforma web o escribe *mi agenda*.'),

('es obligatorio asistir', 
 '📋 La asistencia es importante para obtener tu constancia/certificado. Debes asistir a las sesiones en las que te inscribiste.'),

('hay que pagar', 
 '🆓 La jornada es un evento organizado por la UESSJR para sus estudiantes. Consulta con el Staff si tienes dudas sobre costos.'),

('puedo llevar invitados', 
 '👥 Consulta directamente con el Staff del evento sobre la política de invitados.'),

-- ===== INSCRIPCIONES Y SESIONES =====
('como me inscribo', 
 '📝 Para inscribirte:\n1️⃣ Entra a https://agenda-uessjr.vercel.app\n2️⃣ Inicia sesión\n3️⃣ Busca la sesión que te interese\n4️⃣ Haz clic en Inscribirse\n\nEl sistema evita traslapes automáticamente.'),

('puedo cambiar de sesion', 
 '🔄 Sí, puedes cancelar tu inscripción y registrarte en otra, siempre que haya cupo y no se traslape con tus horarios.'),

('se me traslapa una sesion', 
 '⚠️ El sistema no permite inscribirte en sesiones con horarios que se traslapen. Si quieres cambiar, primero cancela la sesión actual y luego inscríbete en la nueva.'),

('hay cupo', 
 '👥 Cada sesión tiene cupo limitado. Si se llena, puede haber lista de espera. ¡Inscríbete lo antes posible!'),

('no puedo inscribirme', 
 '🚫 Puede ser porque:\n• La sesión ya no tiene cupo\n• Se traslapa con otra sesión tuya\n• No has iniciado sesión\n\nSi el problema persiste, contacta al Staff.'),

('que sesiones hay', 
 '📋 Puedes ver todas las sesiones disponibles en la plataforma web: https://agenda-uessjr.vercel.app\n\nSi ya estás inscrito, escribe *mi agenda* para ver tus sesiones.'),

('cuantas sesiones puedo tomar', 
 '📋 Puedes inscribirte en todas las sesiones que desees, siempre y cuando no se traslapen entre sí y haya cupo disponible.'),

-- ===== ASISTENCIA Y CERTIFICADOS =====
('como registro mi asistencia', 
 '📱 Tu asistencia se registra escaneando tu código QR al llegar a cada sesión. Ten listo tu ticket digital (escribe *ticket* para verlo).'),

('como obtengo mi certificado', 
 '🏆 Las constancias se generan automáticamente cuando cumples con tus asistencias. Escribe *asistencias* para ver cuántas llevas.'),

('cuantas asistencias necesito para el certificado', 
 '📊 Necesitas asistir a las sesiones en las que te inscribiste. Escribe *asistencias* para ver tu progreso.'),

('cuando entregan los certificados', 
 '🏆 Las constancias se generan automáticamente en la plataforma una vez que cumples los requisitos. Consulta al Staff para más detalles.'),

('me pueden dar constancia si no asisti a todo', 
 '📋 Las constancias se generan según tus asistencias verificadas. Consulta con el Staff sobre los requisitos mínimos.'),

-- ===== TICKET Y QR =====
('como obtengo mi ticket', 
 '🎟️ Escribe *ticket* aquí en el chat para recibir tu link con el código QR. También puedes verlo en la plataforma web.'),

('no funciona mi qr', 
 '⚠️ Si tu QR no funciona, intenta:\n1️⃣ Abre el link nuevamente\n2️⃣ Sube el brillo de tu pantalla\n3️⃣ Si sigue fallando, acude a la mesa de registro'),

('perdi mi ticket', 
 '🎟️ ¡No te preocupes! Tu ticket es digital. Escribe *ticket* aquí para recibirlo de nuevo.'),

-- ===== BOT Y TELEGRAM =====
('como vinculo mi telegram', 
 '🔗 Para vincular:\n1️⃣ Entra a https://agenda-uessjr.vercel.app\n2️⃣ Inicia sesión\n3️⃣ Haz clic en "Vincular Telegram"\n4️⃣ Se abrirá aquí automáticamente'),

('que puede hacer el bot', 
 '🤖 Puedo ayudarte con:\n📋 Tu agenda\n🎟️ Tu ticket/QR\n⭐ Tus asistencias\n📍 Ubicaciones\n❓ Preguntas al ponente\n\nEscribe *ayuda* para ver las opciones.'),

('como hago una pregunta al ponente', 
 '❓ Escribe: /pregunta seguido de tu duda.\n\nEjemplo: /pregunta ¿Cómo funciona la inteligencia artificial?\n\nTu pregunta será enviada al moderador.'),

-- ===== UBICACIONES =====
('donde estan los banos', 
 '🚻 Los baños se encuentran en el edificio principal de la UESSJR. Pregunta al Staff si necesitas indicaciones más específicas.'),

('donde puedo comer', 
 '🍽️ Hay opciones de comida en la cafetería de la UESSJR y alrededores del campus. Pregunta al Staff por las opciones durante la jornada.'),

('hay estacionamiento', 
 '🅿️ Sí, hay estacionamiento disponible. Te recomendamos llegar temprano para encontrar lugar.'),

('donde es el registro', 
 '📋 El registro se realiza en la entrada principal. Ten listo tu código QR (escribe *ticket* para obtenerlo).'),

('donde queda el auditorio', 
 '🏛️ El auditorio está dentro de las instalaciones de la UESSJR. Pregunta al Staff por la ubicación exacta o sigue la señalización.'),

('hay wifi', 
 '📶 Para información sobre WiFi durante la jornada, pregunta al Staff en la mesa de registro.'),

-- ===== PROBLEMAS TÉCNICOS =====
('no puedo entrar a la web', 
 '🌐 Intenta:\n1️⃣ Verifica tu internet\n2️⃣ Usa: https://agenda-uessjr.vercel.app\n3️⃣ Prueba otro navegador\n4️⃣ Limpia el caché\n\nSi sigue fallando, contacta al Staff.'),

('olvide mi contrasena', 
 '🔑 Recupera tu contraseña desde la página de inicio de sesión, busca "¿Olvidaste tu contraseña?" y sigue las instrucciones.'),

('no me llegan notificaciones', 
 '🔔 Verifica que:\n1️⃣ Tu Telegram esté vinculado\n2️⃣ No hayas bloqueado al bot\n3️⃣ Tu cuenta web esté activa'),

('la pagina esta lenta', 
 '🌐 Puede ser tu conexión a internet. Intenta recargar la página o usa otro navegador. Si el problema persiste, contacta al Staff.'),

('no me deja calificar', 
 '⭐ Para calificar una sesión, debes haber recibido la solicitud de feedback por este chat. Si no la recibiste, contacta al Staff.'),

-- ===== CONTACTO Y SOPORTE =====
('como contacto al staff', 
 '📞 Puedes contactar al Staff:\n• 🏢 En la mesa de registro\n• 👩‍🏫 Con los organizadores de tu carrera\n\n¡Estamos para ayudarte!'),

('necesito ayuda', 
 '🆘 ¡Claro! Escribe *ayuda* para ver todo lo que puedo hacer, o cuéntame tu duda y trataré de ayudarte.\n\nSi necesitas ayuda presencial, acude a la mesa de registro.'),

('tengo un problema', 
 '🔧 Cuéntame qué problema tienes y trataré de ayudarte. Si es algo técnico con la plataforma, intenta:\n• Recargar la página\n• Usar otro navegador\n• Contactar al Staff presencialmente'),

('quiero hablar con alguien', 
 '📞 Para hablar con una persona, acude a la mesa de registro o contacta a los organizadores de tu carrera.'),

-- ===== MISCELÁNEOS =====
('que dia es hoy', 
 '📅 Puedes revisar las sesiones de hoy escribiendo *mi agenda*. Ahí verás los horarios y escenarios asignados.'),

('me aburro', 
 '😄 ¡Aprovecha la jornada! Escribe *mi agenda* para ver qué sesiones tienes o visita la web para explorar las actividades disponibles.'),

('esta buena la jornada', 
 '🎉 ¡Nos alegra que la disfrutes! No olvides calificar tus sesiones cuando te llegue la solicitud. Tu opinión es importante. ⭐'),

('cuando acaba', 
 '📅 El horario de cierre depende de las sesiones programadas. Escribe *mi agenda* para ver tus horarios.'),

('llueve afuera', 
 '🌧️ ¡Esperemos que no! Si necesitas resguardarte, las sesiones son en espacios techados. Pregunta al Staff si necesitas ayuda.'),

('tengo hambre', 
 '🍽️ Puedes encontrar comida en la cafetería de la UESSJR y alrededores. ¡Buen provecho!'),

('donde hay agua', 
 '💧 Puedes encontrar agua en la cafetería o pregunta al Staff por los puntos de hidratación disponibles.'),

('hay internet', 
 '📶 Pregunta al Staff en la mesa de registro sobre las opciones de WiFi durante el evento.');

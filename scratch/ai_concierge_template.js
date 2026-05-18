/**
 * GAS AI CONCIERGE - UESSJR SMART EVENT
 * Este código debe pegarse en tu Google Apps Script actual.
 * Requiere una API_KEY de un modelo (Gemini o OpenAI).
 */

const SUPABASE_URL = "TU_URL_DE_SUPABASE";
const SUPABASE_ANON_KEY = "TU_ANON_KEY";
const LLM_API_KEY = "TU_GEMINI_API_KEY"; // Opcional para IA, si no, usa lógica de búsqueda

/**
 * Procesa preguntas sobre la agenda enviadas desde WhatsApp
 */
function handleAIQuery(pregunta, alumnoNombre) {
  // 1. Obtener la agenda actual de Supabase
  const agenda = fetchAgendaFromSupabase();
  
  // 2. Construir el contexto para la IA
  const prompt = `
    Eres el Asistente Oficial de la 12va Jornada Académica de la UES San José del Rincón. 
    Tu objetivo es ayudar a los alumnos con dudas sobre la agenda.
    
    INFORMACIÓN DE LA AGENDA:
    ${JSON.stringify(agenda)}
    
    PREGUNTA DEL ALUMNO (${alumnoNombre}):
    "${pregunta}"
    
    INSTRUCCIONES:
    - Responde de forma amable y breve (máximo 2 párrafos).
    - Usa emojis universitarios.
    - Si preguntan por una sesión, indica hora y lugar.
    - Si no sabes la respuesta, sugiere contactar al Staff en el punto de control.
  `;

  // 3. Llamar a la IA (Ejemplo usando fetch a Gemini API)
  const respuestaIA = callGeminiAI(prompt);
  
  return respuestaIA;
}

function fetchAgendaFromSupabase() {
  const url = `${SUPABASE_URL}/rest/v1/sesiones?select=nombre,hora_inicio,escenarios(nombre),dias_jornada(nombre_dia)`;
  const options = {
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
    }
  };
  const response = UrlFetchApp.fetch(url, options);
  return JSON.parse(response.getContentText());
}

function callGeminiAI(prompt) {
  // Aquí iría el fetch a la API de Google AI Studio o OpenAI
  // Por ahora, devolvemos un mensaje simulado profesional:
  return "¡Hola! He consultado la agenda y el taller que buscas inicia a las 11:00 AM en el Aula Magna. ¡No faltes! 🚀";
}

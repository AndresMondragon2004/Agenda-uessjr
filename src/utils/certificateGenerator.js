import { jsPDF } from 'jspdf';

/**
 * generateCertificate: Crea un PDF de constancia dinámico basado en plantillas Marca Blanca.
 * 
 * @param {Object} data - Datos para la constancia
 * @param {string} data.studentName - Nombre completo del alumno
 * @param {string} data.activityName - Nombre de la sesión/actividad
 * @param {Object} settings - Configuración del sistema (branding + templates)
 */
export const generateCertificate = async (data, settings) => {
  const { studentName, activityName } = data;
  const { branding, advanced_templates } = settings;

  // 1. Configuración del documento (A4 Horizontal por defecto para constancias)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  try {
    // 2. Cargar imagen de fondo (Plantilla Marca Blanca)
    // Usamos el fondo configurado en branding o uno por defecto
    const bgUrl = branding.background_image || '/images/certificate-placeholder.jpg';
    
    // Convertir imagen a base64 para jsPDF (necesario para URLs externas)
    const img = await loadImage(bgUrl);
    doc.addImage(img, 'JPEG', 0, 0, pageWidth, pageHeight);

    // 3. Estilo de Texto
    doc.setTextColor(branding.primary_color || '#163020');
    doc.setFont('helvetica', 'bold');
    
    // 4. Inyección de Nombre (Coordenadas Dinámicas)
    // Las coordenadas vienen de 'advanced_templates' configuradas por el admin
    const coords = advanced_templates?.certificate_coords || { x: pageWidth / 2, y: pageHeight / 2 };
    
    doc.setFontSize(36);
    doc.text(studentName.toUpperCase(), coords.x, coords.y, { align: 'center' });

    // 5. Inyección de Actividad (Debajo del nombre o en coords secundarias)
    doc.setFontSize(18);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40); // Gris oscuro neutral
    doc.text(activityName, coords.x, coords.y + 40, { align: 'center', maxWidth: 400 });

    // 6. Fecha y Firma (Opcional, puede venir de event_info)
    const eventDate = settings.event_info?.end_date || new Date().toLocaleDateString();
    doc.setFontSize(12);
    doc.text(`Emitido el: ${eventDate}`, pageWidth - 60, pageHeight - 40, { align: 'right' });

    // 7. Disparar Descarga
    const fileName = `Constancia_${studentName.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);

    return { success: true };
  } catch (error) {
    console.error('Error generando PDF:', error);
    return { success: false, error };
  }
};

/**
 * Helper para cargar imágenes de forma asíncrona
 */
const loadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Evitar problemas de CORS
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });
};

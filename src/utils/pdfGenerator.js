import { supabase } from '../services/supabase'

// ─── Constants (shared with Reports.jsx for consistency) ───────────────────
const TIPO_LABELS = {
  inauguracion: 'Inauguración',
  conferencia:  'Conferencia',
  taller:       'Taller',
  cultural:     'Cultural',
  protocolo:    'Protocolo',
  competencia:  'Competencia',
  cierre:       'Cierre',
}

const TIPO_COLORS_PDF = {
  inauguracion: { bg: [230, 241, 251], text: [24,  95,  165] },
  conferencia:  { bg: [234, 243, 222], text: [59,  109,  17] },
  taller:       { bg: [250, 238, 218], text: [133,  79,  11] },
  cultural:     { bg: [238, 237, 254], text: [60,   52, 137] },
  protocolo:    { bg: [243, 244, 246], text: [107, 114, 128] },
  competencia:  { bg: [250, 236, 231], text: [153,  60,  29] },
  cierre:       { bg: [252, 235, 235], text: [163,  45,  45] },
}

const PAGE_W        = 297
const PAGE_H        = 210
const MARGIN        = 15
const HEADER_H      = 30
const FOOTER_Y      = PAGE_H - 22
const SESSIONS_TOP  = HEADER_H + 4
const SESSIONS_BOT  = FOOTER_Y - 2
const AREA_H        = SESSIONS_BOT - SESSIONS_TOP
const COL_LEFT_W    = (PAGE_W - 2 * MARGIN) * 0.62
const PHOTO_GAP     = (PAGE_W - 2 * MARGIN) * 0.03
const PHOTO_W       = (PAGE_W - 2 * MARGIN) * 0.35
const PHOTO_X       = MARGIN + COL_LEFT_W + PHOTO_GAP
const PHOTO_H       = AREA_H
const TIME_COL_W    = 28
const SESSION_X     = MARGIN + TIME_COL_W + 2
const SESSION_W     = COL_LEFT_W - TIME_COL_W - 2
const ROW_H_DYN     = (n) => Math.min(AREA_H / Math.max(n, 1), 38)

const IMAGENES_POR_DIA = {
  'Lunes':     '/images/imagenes_reporte/ajolote_lunes.jpg',
  'Martes':    '/images/imagenes_reporte/software_martes.jpg',
  'Miércoles': '/images/imagenes_reporte/manualidades_miercoles.jpg',
  'Jueves':    '/images/imagenes_reporte/computacion_jueves.jpg',
  'Viernes':   '/images/imagenes_reporte/robots_viernes.jpg',
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function formatDayLong(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha + 'T12:00:00')
  const s = d.toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function drawPhotoPlaceholder(doc, imgTematica) {
  const x = PHOTO_X
  const y = SESSIONS_TOP
  const w = PHOTO_W
  const h = PHOTO_H
  if (imgTematica) {
    doc.addImage(imgTematica, 'PNG', x, y, w, h)
  } else {
    doc.setFillColor(233, 237, 233)
    doc.setDrawColor(156, 163, 175)
    doc.setLineWidth(0.5)
    doc.setLineDash([3, 3])
    doc.rect(x, y, w, h, 'FD')
    doc.setLineDash([])
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(107, 114, 128)
    doc.text('Foto temática', x + w / 2, y + h / 2 - 4, { align: 'center' })
    doc.text('(insertar imagen)', x + w / 2, y + h / 2 + 3, { align: 'center' })
  }
}

async function tryLoadImage(url) {
  return new Promise(resolve => {
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width  = img.width
          canvas.height = img.height
          canvas.getContext('2d').drawImage(img, 0, 0)
          resolve(canvas.toDataURL('image/png'))
        } catch { resolve(null) }
      }
      img.onerror = () => resolve(null)
      img.src = url
    } catch { resolve(null) }
  })
}

function drawPDFHeader(doc, jornada, dia, isContinuation, imgUES, imgUMB) {
  const cx = PAGE_W / 2
  doc.setDrawColor(27, 67, 50)
  doc.setLineWidth(1.5)
  doc.line(0, 0, PAGE_W, 0)
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.5)
  doc.setLineDash([2, 2])
  if (imgUMB) {
    doc.addImage(imgUMB, 'PNG', MARGIN, 3, 30, 16)
  } else {
    doc.rect(MARGIN, 3, 30, 16)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5.5)
    doc.setTextColor(180, 180, 180)
    doc.text('[LOGO UMB]', MARGIN + 15, 12, { align: 'center' })
  }
  if (imgUES) {
    doc.addImage(imgUES, 'PNG', PAGE_W - MARGIN - 30, 3, 30, 16)
  } else {
    doc.rect(PAGE_W - MARGIN - 30, 3, 30, 16)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5.5)
    doc.setTextColor(180, 180, 180)
    doc.text('[LOGO UES SJR]', PAGE_W - MARGIN - 15, 12, { align: 'center' })
  }
  doc.setLineDash([])
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(27, 67, 50)
  doc.text('UES SAN JOSÉ DEL RINCÓN', cx, 10, { align: 'center' })
  const dayText = isContinuation
    ? formatDayLong(dia.fecha) + ' — continuación'
    : formatDayLong(dia.fecha)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(212, 160, 23)
  doc.text((jornada.nombre || '').toUpperCase(), cx, 16, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(100, 100, 100)
  doc.text(dayText.toUpperCase(), cx, 21, { align: 'center' })
  doc.setDrawColor(212, 160, 23)
  doc.setLineWidth(1)
  doc.line(MARGIN, HEADER_H - 2, PAGE_W - MARGIN, HEADER_H - 2)
}

function drawPDFFooter(doc, logosConImagen, jornada, pageNum, totalPages) {
  const cx = PAGE_W / 2
  const fy = FOOTER_Y
  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.6)
  doc.line(MARGIN, fy, PAGE_W - MARGIN, fy)
  
  const items   = (logosConImagen || []).slice(0, 5)
  const spacing = 15
  const totalW  = (items.length - 1) * spacing
  const startX  = cx - totalW / 2

  items.forEach((inst, i) => {
    const lx = startX + i * spacing
    if (inst.imgData) {
      doc.addImage(inst.imgData, 'PNG', lx - 6, fy + 2, 12, 8, undefined, 'FAST')
    } else {
      doc.setDrawColor(27, 67, 50)
      doc.setLineWidth(0.6)
      doc.setFillColor(255, 255, 255)
      doc.circle(lx, fy + 7, 3.5, 'FD')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(5)
      doc.setTextColor(27, 67, 50)
      doc.text((inst.nombre?.[0] || '?').toUpperCase(), lx, fy + 8.5, { align: 'center' })
    }
  })
  const raw  = (jornada.lema || 'Cultura que inspira, conocimiento que transforma').replace(/^"|"$/g, '')
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7)
  doc.setTextColor(107, 114, 128)
  doc.text(`"${raw}"`, cx, fy + 14, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(180, 180, 180)
  doc.text(`${pageNum} / ${totalPages}`, PAGE_W - MARGIN, fy + 14, { align: 'right' })
}

function drawPDFPortada(doc, jornada, imgUES, imgUMB, logosConImagen) {
  const cx = PAGE_W / 2
  const cy = PAGE_H / 2
  doc.setFillColor(249, 247, 242)
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F')
  doc.setDrawColor(27, 67, 50)
  doc.setLineWidth(1.5)
  doc.line(0, 0, PAGE_W, 0)
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.5)
  doc.setLineDash([2, 2])
  if (imgUMB) {
    doc.addImage(imgUMB, 'PNG', MARGIN, 3, 30, 16)
  } else {
    doc.rect(MARGIN, 3, 30, 16)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5.5)
    doc.setTextColor(180, 180, 180)
    doc.text('[LOGO UMB]', MARGIN + 15, 12, { align: 'center' })
  }
  if (imgUES) {
    doc.addImage(imgUES, 'PNG', PAGE_W - MARGIN - 30, 3, 30, 16)
  } else {
    doc.rect(PAGE_W - MARGIN - 30, 3, 30, 16)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5.5)
    doc.setTextColor(180, 180, 180)
    doc.text('[LOGO UES SJR]', PAGE_W - MARGIN - 15, 12, { align: 'center' })
  }
  doc.setLineDash([])
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(27, 67, 50)
  doc.text('UES SAN JOSÉ DEL RINCÓN', cx, 12, { align: 'center' })
  doc.setDrawColor(212, 160, 23)
  doc.setLineWidth(1)
  doc.line(MARGIN, 22, PAGE_W - MARGIN, 22)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(40)
  doc.setTextColor(27, 67, 50)
  doc.text('Jornada Académica', cx, cy - 10, { align: 'center' })
  doc.text('y Cultural 2026',   cx, cy + 14, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)
  doc.text('P R O G R A M A   D E   A C T I V I D A D E S', cx, cy + 26, { align: 'center' })
  doc.setDrawColor(212, 160, 23)
  doc.setLineWidth(2.5)
  doc.line(cx - 20, cy + 31, cx + 20, cy + 31)
  const periodo = jornada?.periodo || '4 al 8 de mayo'
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(27, 67, 50)
  doc.text(periodo, cx, cy + 40, { align: 'center' })
  
  const fy = FOOTER_Y
  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.6)
  doc.line(MARGIN, fy, PAGE_W - MARGIN, fy)
  
  const items   = (logosConImagen || []).slice(0, 5)
  const spacing = 18
  const totalW  = (items.length - 1) * spacing
  const startX  = cx - totalW / 2
  items.forEach((inst, i) => {
    const lx = startX + i * spacing
    if (inst.imgData) {
      doc.addImage(inst.imgData, 'PNG', lx - 7, fy + 2, 14, 9, undefined, 'FAST')
    }
  })
  const raw  = (jornada?.lema || 'Cultura que inspira, conocimiento que transforma').replace(/^"|"$/g, '')
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7)
  doc.setTextColor(107, 114, 128)
  doc.text(`"${raw}"`, cx, fy + 14, { align: 'center' })
}

function drawSessionsColumn(doc, sesiones, incluyePonentes) {
  const rowH    = ROW_H_DYN(sesiones.length)
  const areaTop = SESSIONS_TOP
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(27, 67, 50)
  doc.text('HORARIO', MARGIN, areaTop)
  doc.text('ACTIVIDAD Y PONENTE', SESSION_X, areaTop)
  doc.setDrawColor(212, 160, 23)
  doc.setLineWidth(0.8)
  doc.line(MARGIN, areaTop + 2, MARGIN + COL_LEFT_W, areaTop + 2)
  sesiones.forEach((ses, idx) => {
    const rowTop = areaTop + 6 + idx * rowH
    const timeStr = ses.hora_inicio ? ses.hora_inicio.slice(0, 5) + ' hrs' : ''
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(45, 106, 79)
    doc.text(timeStr, MARGIN, rowTop + 5)
    const tipo      = ses.tipo || 'protocolo'
    const tc        = TIPO_COLORS_PDF[tipo] || TIPO_COLORS_PDF.protocolo
    const tipoLabel = (TIPO_LABELS[tipo] || tipo).toUpperCase()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(...tc.text)
    const bW = doc.getTextWidth(tipoLabel) + 5
    doc.setFillColor(...tc.bg)
    doc.roundedRect(SESSION_X, rowTop, bW, 4.5, 1.2, 1.2, 'F')
    doc.text(tipoLabel, SESSION_X + bW / 2, rowTop + 3.3, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(17, 24, 39)
    const nameLines = doc.splitTextToSize(ses.nombre || '', SESSION_W)
    doc.text(nameLines.slice(0, 2), SESSION_X, rowTop + 9)
    const twoLines = nameLines.length > 1
    let nextY = twoLines ? rowTop + 17 : rowTop + 13.5
    const pStr = [ses.ponente_grado, ses.ponente_nombre].filter(Boolean).join(' ')
    if (incluyePonentes && pStr && nextY + 3 <= rowTop + rowH) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(107, 114, 128)
      doc.text(pStr, SESSION_X, nextY)
      nextY += 4
    }
    if (ses.escenarios?.nombre && nextY + 2 <= rowTop + rowH) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(45, 106, 79)
      doc.text(`• ${ses.escenarios.nombre}`, SESSION_X, nextY)
    }
    if (idx < sesiones.length - 1) {
      const sepY = rowTop + rowH - 1
      doc.setDrawColor(229, 231, 235)
      doc.setLineWidth(0.3)
      doc.line(MARGIN, sepY, MARGIN + COL_LEFT_W, sepY)
    }
  })
}

export async function generateAgendaPDF(jornada, sesiones, options = {}) {
  const { jsPDF } = await import('jspdf')
  const {
    incluyePonentes = true,
    diasSeleccionados = 'todos'
  } = options

  if (!jornada) throw new Error('No hay jornada activa')

  const [imgUES, imgUMB] = await Promise.all([
    tryLoadImage('/images/logos/ues-sjr.png'),
    tryLoadImage('/images/logos/umb.png')
  ])

  // Cargar instituciones
  const { data: instituciones } = await supabase.from('instituciones').select('*').order('orden')
  const subsetInst = (instituciones || []).slice(0, 5)
  const instLogos = await Promise.all(subsetInst.map(l => tryLoadImage(l.logotipo_url)))

  const logosConImagen = subsetInst.map((l, i) => ({
    ...l,
    imgData: instLogos[i]
  }))

  const dias = (jornada.dias_jornada || []).sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
  const diasAIncluir = diasSeleccionados === 'todos' ? dias : dias.filter(d => d.id === diasSeleccionados)

  const sesionesPorDia = {}
  diasAIncluir.forEach(d => { sesionesPorDia[d.id] = [] })
  sesiones.forEach(s => {
    if (sesionesPorDia[s.dia_jornada_id]) sesionesPorDia[s.dia_jornada_id].push(s)
  })

  const totalPaginas = 1 + diasAIncluir.length
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' })

  drawPDFPortada(doc, jornada, imgUES, imgUMB, logosConImagen)

  let pageNum = 1
  for (let idx = 0; idx < diasAIncluir.length; idx++) {
    const dia = diasAIncluir[idx]
    doc.addPage()
    const sesDia = [...(sesionesPorDia[dia.id] || [])].sort(
      (a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || '')
    )
    doc.setFillColor(249, 247, 242)
    doc.rect(0, 0, PAGE_W, PAGE_H, 'F')
    
    // Cargar imagen temática del día
    const imgUrl = dia.imagen_url || IMAGENES_POR_DIA[dia.nombre_dia]
    const loadedImg = imgUrl ? await tryLoadImage(imgUrl) : null

    drawPDFHeader(doc, jornada, dia, false, imgUES, imgUMB)
    drawSessionsColumn(doc, sesDia, incluyePonentes)
    drawPhotoPlaceholder(doc, loadedImg)
    drawPDFFooter(doc, logosConImagen, jornada, pageNum, totalPaginas - 1)
    pageNum++
  }

  const safeNombre = (jornada.nombre || 'Jornada').replace(/\s+/g, '-').replace(/[^\w-]/g, '')
  doc.save(`Programa-${safeNombre}-UESSJR.pdf`)
}

export async function generateConstanciaPDF(estudiante, jornada) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' })
  
  const validCode = `VERIFY-${estudiante.id}-${jornada?.id.split('-')[0]}`.toUpperCase()
  const verifyUrl = `${window.location.origin}/verificar/${validCode}`
  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}&margin=1&format=png`

  const [imgUES, imgUMB, imgQR] = await Promise.all([
    tryLoadImage('/images/logos/ues-sjr.png'),
    tryLoadImage('/images/logos/umb.png'),
    tryLoadImage(qrImgUrl)
  ])

  const cx = 297 / 2
  const cy = 210 / 2

  // 1. Fondo base elegante (Papel hueso sutil)
  doc.setFillColor(252, 252, 250)
  doc.rect(0, 0, 297, 210, 'F')
  
  // 2. Marcos Perimetrales Estilo Diploma
  // Marco Exterior (Verde UES)
  doc.setDrawColor(27, 67, 50)
  doc.setLineWidth(3.5)
  doc.rect(10, 10, 277, 190)
  
  // Marco Interior (Dorado Fino)
  doc.setDrawColor(212, 160, 23)
  doc.setLineWidth(0.6)
  doc.rect(15, 15, 267, 180)

  // Acentos Dorados en las esquinas
  doc.setDrawColor(212, 160, 23)
  doc.setLineWidth(2)
  const l = 15 // Longitud del acento
  // Sup-Izq
  doc.line(13, 13, 13 + l, 13); doc.line(13, 13, 13, 13 + l);
  // Sup-Der
  doc.line(284, 13, 284 - l, 13); doc.line(284, 13, 284, 13 + l);
  // Inf-Izq
  doc.line(13, 197, 13 + l, 197); doc.line(13, 197, 13, 197 - l);
  // Inf-Der
  doc.line(284, 197, 284 - l, 197); doc.line(284, 197, 284, 197 - l);

  // 3. Marca de Agua (Logo UES translúcido)
  if (imgUES) {
    doc.setGState(new doc.GState({ opacity: 0.05 }))
    doc.addImage(imgUES, 'PNG', cx - 60, cy - 30, 120, 60)
    doc.setGState(new doc.GState({ opacity: 1.0 }))
  }

  // 4. Logos Institucionales Superiores
  if (imgUMB) doc.addImage(imgUMB, 'PNG', 20, 16, 38, 18)
  if (imgUES) doc.addImage(imgUES, 'PNG', 239, 16, 38, 18)

  // 5. Encabezado Institucional
  doc.setFont('times', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(27, 67, 50)
  doc.text('UNIVERSIDAD MEXIQUENSE DEL BICENTENARIO', cx, 42, { align: 'center' })
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(75, 85, 99)
  doc.text('UNIDAD DE ESTUDIOS SUPERIORES SAN JOSÉ DEL RINCÓN', cx, 48, { align: 'center' })

  // Línea divisoria encabezado
  doc.setDrawColor(212, 160, 23)
  doc.setLineWidth(0.4)
  doc.line(cx - 70, 53, cx + 70, 53)

  // 6. Título del Documento
  doc.setFont('times', 'bold')
  doc.setFontSize(36)
  doc.setTextColor(212, 160, 23) // Dorado
  doc.text('CONSTANCIA', cx, 75, { align: 'center' })

  // 7. Cuerpo del Certificado
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(14)
  doc.setTextColor(100, 100, 100)
  doc.text('Que se otorga a:', cx, 95, { align: 'center' })

  // Nombre del Estudiante
  doc.setFont('times', 'italic')
  doc.setFontSize(34)
  doc.setTextColor(17, 24, 39)
  const fullName = `${estudiante.nombre} ${estudiante.apellidos}`.toUpperCase()
  doc.text(fullName, cx, 115, { align: 'center' })

  // Subrayado del nombre
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.5)
  const nameWidth = doc.getTextWidth(fullName)
  doc.line(cx - (nameWidth/2) - 10, 118, cx + (nameWidth/2) + 10, 118)

  // Motivo
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(14)
  doc.setTextColor(75, 85, 99)
  const textoMotivo = `Por su destacada participación en la ${jornada?.edicion || '12va'} Jornada Académica y Cultural:`
  doc.text(textoMotivo, cx, 134, { align: 'center' })

  // Nombre de la Jornada / Lema
  doc.setFont('times', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(27, 67, 50)
  const lema = `"${jornada?.lema || 'Cultura que inspira, conocimiento que transforma'}"`
  doc.text(lema, cx, 144, { align: 'center' })

  // Fechas
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(107, 114, 128)
  const dateStr = `Realizada del ${new Date(jornada?.fecha_inicio + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })} al ${new Date(jornada?.fecha_fin + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}.`
  doc.text(dateStr, cx, 153, { align: 'center' })

  // 8. Zona de Firmas
  doc.setDrawColor(100, 100, 100)
  doc.setLineWidth(0.5)
  doc.line(cx - 45, 180, cx + 45, 180)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(27, 67, 50)
  doc.text('DIRECCIÓN ACADÉMICA', cx, 186, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text('UES SAN JOSÉ DEL RINCÓN', cx, 191, { align: 'center' })

  // 9. Código QR y Validación
  if (imgQR) {
    // Caja contenedora sutil para el QR
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.3)
    doc.roundedRect(22, 155, 28, 28, 2, 2, 'FD')
    
    // Imprimir el código QR
    doc.addImage(imgQR, 'PNG', 23, 156, 26, 26)
    
    // Texto de verificación
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(130, 130, 130)
    doc.text('ESCANEAR PARA', 36, 188, { align: 'center' })
    doc.text('VERIFICAR', 36, 191, { align: 'center' })
  }

  // Identificador único textual
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  doc.setTextColor(0, 0, 0) // Negro para mejor legibilidad
  doc.text(`ID: ${validCode}`, 22, 193.5, { align: 'left' })

  doc.save(`Constancia-${estudiante.nombre.replace(/\s+/g, '_')}-UESSJR.pdf`)
}

export async function generatePersonalAgendaPDF(estudiante, jornada, inscripciones) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' })
  
  const [imgUES, imgUMB] = await Promise.all([
    tryLoadImage('/images/logos/ues-sjr.png'),
    tryLoadImage('/images/logos/umb.png')
  ])

  // Cargar instituciones para la portada
  const { data: instituciones } = await supabase.from('instituciones').select('*').order('orden')
  const subsetInst = (instituciones || []).slice(0, 5)
  const instLogos = await Promise.all(subsetInst.map(l => tryLoadImage(l.logotipo_url)))

  const logosConImagen = subsetInst.map((l, i) => ({
    ...l,
    imgData: instLogos[i]
  }))

  // Filtrar solo sesiones confirmadas
  const misInscripciones = inscripciones.filter(i => i.estado === 'confirmada' && i.sesiones)
  
  if (misInscripciones.length === 0) {
    throw new Error('No tienes sesiones confirmadas para generar la agenda.')
  }

  // Agrupar por día (usando fecha en lugar de id ya que no se consulta el id)
  const agrupadas = misInscripciones.reduce((acc, insc) => {
    const dia = insc.sesiones?.dias_jornada || { fecha: 'sin-fecha', nombre_dia: 'Por definir' }
    const key = dia.fecha || 'sin-fecha'
    
    if (!acc[key]) {
      acc[key] = { dia, sesiones: [] }
    }
    acc[key].sesiones.push(insc.sesiones)
    return acc
  }, {})

  const diasIds = Object.keys(agrupadas).sort((a, b) => {
    if (a === 'sin-fecha') return 1;
    if (b === 'sin-fecha') return -1;
    return new Date(agrupadas[a].dia.fecha) - new Date(agrupadas[b].dia.fecha)
  })

  // Dibujar portada en la primera página
  drawPDFPortada(doc, jornada, imgUES, imgUMB, logosConImagen)

  const totalPaginas = diasIds.length
  let pageNum = 1

  diasIds.forEach((diaId) => {
    doc.addPage()
    
    const { dia, sesiones } = agrupadas[diaId]
    const sesSorted = [...sesiones].sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''))

    // Fondo
    doc.setFillColor(249, 247, 242)
    doc.rect(0, 0, PAGE_W, PAGE_H, 'F')

    // Header Personalizado
    const cx = PAGE_W / 2
    doc.setDrawColor(27, 67, 50)
    doc.setLineWidth(1.5)
    doc.line(0, 0, PAGE_W, 0)
    
    if (imgUMB) doc.addImage(imgUMB, 'PNG', MARGIN, 3, 30, 16)
    if (imgUES) doc.addImage(imgUES, 'PNG', PAGE_W - MARGIN - 30, 3, 30, 16)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(27, 67, 50)
    doc.text('MI AGENDA PERSONAL', cx, 10, { align: 'center' })
    
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text(`${estudiante.nombre} ${estudiante.apellidos}`.toUpperCase(), cx, 15, { align: 'center' })

    doc.setFontSize(8)
    doc.setTextColor(212, 160, 23)
    const tituloDia = dia.fecha === 'sin-fecha' ? 'Sesiones sin fecha asignada' : formatDayLong(dia.fecha)
    doc.text(tituloDia.toUpperCase(), cx, 21, { align: 'center' })

    doc.setDrawColor(212, 160, 23)
    doc.setLineWidth(1)
    doc.line(MARGIN, HEADER_H - 2, PAGE_W - MARGIN, HEADER_H - 2)

    // Columnas de sesiones
    drawSessionsColumn(doc, sesSorted, true)
    
    // Footer
    const fy = FOOTER_Y
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.6)
    doc.line(MARGIN, fy, PAGE_W - MARGIN, fy)
    
    const raw = (jornada?.lema || 'Cultura que inspira, conocimiento que transforma').replace(/^"|"$/g, '')
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7)
    doc.setTextColor(107, 114, 128)
    doc.text(`"${raw}"`, cx, fy + 12, { align: 'center' })
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.text(`Página ${pageNum} de ${totalPaginas}`, PAGE_W - MARGIN, fy + 12, { align: 'right' })
    
    pageNum++
  })

  doc.save(`Mi-Agenda-${estudiante.nombre.replace(/\s+/g, '-')}.pdf`)
}

export async function generateConstanciasPonentesMasivoPDF(sesiones, jornada) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' })
  
  const [imgUES, imgUMB] = await Promise.all([
    tryLoadImage('/images/logos/ues-sjr.png'),
    tryLoadImage('/images/logos/umb.png')
  ])

  const cx = 297 / 2
  const cy = 210 / 2

  let isFirstPage = true

  for (const sesion of sesiones) {
    if (!isFirstPage) {
      doc.addPage()
    }
    isFirstPage = false

    // 1. Fondo base elegante (Papel hueso sutil)
    doc.setFillColor(252, 252, 250)
    doc.rect(0, 0, 297, 210, 'F')
    
    // 2. Marcos Perimetrales Estilo Diploma
    doc.setDrawColor(27, 67, 50)
    doc.setLineWidth(3.5)
    doc.rect(10, 10, 277, 190)
    
    doc.setDrawColor(212, 160, 23)
    doc.setLineWidth(0.6)
    doc.rect(15, 15, 267, 180)

    doc.setDrawColor(212, 160, 23)
    doc.setLineWidth(2)
    const l = 15
    doc.line(13, 13, 13 + l, 13); doc.line(13, 13, 13, 13 + l);
    doc.line(284, 13, 284 - l, 13); doc.line(284, 13, 284, 13 + l);
    doc.line(13, 197, 13 + l, 197); doc.line(13, 197, 13, 197 - l);
    doc.line(284, 197, 284 - l, 197); doc.line(284, 197, 284, 197 - l);

    // 3. Marca de Agua
    if (imgUES) {
      doc.setGState(new doc.GState({ opacity: 0.05 }))
      doc.addImage(imgUES, 'PNG', cx - 60, cy - 30, 120, 60)
      doc.setGState(new doc.GState({ opacity: 1.0 }))
    }

    // 4. Logos
    if (imgUMB) doc.addImage(imgUMB, 'PNG', 20, 16, 38, 18)
    if (imgUES) doc.addImage(imgUES, 'PNG', 239, 16, 38, 18)

    // 5. Encabezado
    doc.setFont('times', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(27, 67, 50)
    doc.text('UNIVERSIDAD MEXIQUENSE DEL BICENTENARIO', cx, 42, { align: 'center' })
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(75, 85, 99)
    doc.text('UNIDAD DE ESTUDIOS SUPERIORES SAN JOSÉ DEL RINCÓN', cx, 48, { align: 'center' })

    doc.setDrawColor(212, 160, 23)
    doc.setLineWidth(0.4)
    doc.line(cx - 70, 53, cx + 70, 53)

    // 6. Título
    doc.setFont('times', 'bold')
    doc.setFontSize(36)
    doc.setTextColor(212, 160, 23)
    doc.text('CONSTANCIA', cx, 75, { align: 'center' })

    // 7. Cuerpo
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(14)
    doc.setTextColor(100, 100, 100)
    doc.text('Otorga la presente a:', cx, 95, { align: 'center' })

    // Nombre Ponente
    doc.setFont('times', 'italic')
    doc.setFontSize(34)
    doc.setTextColor(17, 24, 39)
    const grado = sesion.ponente_grado || ''
    const nombre = sesion.ponente_nombre || ''
    const fullName = `${grado} ${nombre}`.trim().toUpperCase()
    doc.text(fullName, cx, 115, { align: 'center' })

    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(0.5)
    const nameWidth = doc.getTextWidth(fullName)
    doc.line(cx - (nameWidth/2) - 10, 118, cx + (nameWidth/2) + 10, 118)

    // Motivo
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(13)
    doc.setTextColor(75, 85, 99)
    const textoMotivo = `Por su destacada participación como PONENTE impartiendo la sesión:`
    doc.text(textoMotivo, cx, 134, { align: 'center' })

    // Nombre de la Sesión
    doc.setFont('times', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(27, 67, 50)
    const nombreSesion = `"${sesion.nombre}"`
    
    // Auto-wrap the session name if it's too long
    const splitTitle = doc.splitTextToSize(nombreSesion, 220)
    doc.text(splitTitle, cx, 144, { align: 'center' })

    // Fechas / Jornada
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(107, 114, 128)
    const yOffset = 144 + (splitTitle.length - 1) * 7
    const dateStr = `En el marco de la ${jornada?.edicion || '12va'} Jornada Académica y Cultural, realizada del ${new Date(jornada?.fecha_inicio + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })} al ${new Date(jornada?.fecha_fin + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}.`
    doc.text(dateStr, cx, yOffset + 12, { align: 'center' })

    // 8. Firmas
    doc.setDrawColor(100, 100, 100)
    doc.setLineWidth(0.5)
    doc.line(cx - 45, 180, cx + 45, 180)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(27, 67, 50)
    doc.text('DIRECCIÓN ACADÉMICA', cx, 186, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text('UES SAN JOSÉ DEL RINCÓN', cx, 191, { align: 'center' })
  }

  doc.save(`Constancias-Ponentes-${jornada?.nombre.replace(/\s+/g, '_') || 'Jornada'}.pdf`)
}

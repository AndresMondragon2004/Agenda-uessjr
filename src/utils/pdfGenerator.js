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
  diasAIncluir.forEach((dia, idx) => {
    doc.addPage()
    const sesDia = [...(sesionesPorDia[dia.id] || [])].sort(
      (a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || '')
    )
    doc.setFillColor(249, 247, 242)
    doc.rect(0, 0, PAGE_W, PAGE_H, 'F')
    drawPDFHeader(doc, jornada, dia, false, imgUES, imgUMB)
    drawSessionsColumn(doc, sesDia, incluyePonentes)
    drawPhotoPlaceholder(doc, imagenesTematicas[idx])
    drawPDFFooter(doc, logosConImagen, jornada, pageNum, totalPaginas - 1)
    pageNum++
  })

  const safeNombre = (jornada.nombre || 'Jornada').replace(/\s+/g, '-').replace(/[^\w-]/g, '')
  doc.save(`Programa-${safeNombre}-UESSJR.pdf`)
}

export async function generateConstanciaPDF(estudiante, jornada) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' })
  
  const [imgUES, imgUMB] = await Promise.all([
    tryLoadImage('/images/logos/ues-sjr.png'),
    tryLoadImage('/images/logos/umb.png')
  ])

  const cx = 297 / 2
  const cy = 210 / 2

  // Fondo elegante
  doc.setFillColor(252, 251, 247)
  doc.rect(0, 0, 297, 210, 'F')
  
  // Marco institucional
  doc.setDrawColor(27, 67, 50)
  doc.setLineWidth(1)
  doc.rect(10, 10, 277, 190)
  doc.setDrawColor(212, 160, 23)
  doc.setLineWidth(0.5)
  doc.rect(12, 12, 273, 186)

  // Logos
  if (imgUMB) doc.addImage(imgUMB, 'PNG', 25, 20, 45, 22)
  if (imgUES) doc.addImage(imgUES, 'PNG', 227, 20, 45, 22)

  // Textos
  doc.setFont('times', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(27, 67, 50)
  doc.text('UNIVERSIDAD MEXIQUENSE DEL BICENTENARIO', cx, 45, { align: 'center' })
  
  doc.setFontSize(14)
  doc.text('UNIDAD DE ESTUDIOS SUPERIORES SAN JOSÉ DEL RINCÓN', cx, 52, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(32)
  doc.setTextColor(212, 160, 23)
  doc.text('CONSTANCIA', cx, 85, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(14)
  doc.setTextColor(75, 85, 99)
  doc.text('Se otorga la presente a:', cx, 105, { align: 'center' })

  doc.setFont('times', 'bolditalic')
  doc.setFontSize(28)
  doc.setTextColor(17, 24, 39)
  doc.text(`${estudiante.nombre} ${estudiante.apellidos}`.toUpperCase(), cx, 120, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(14)
  doc.setTextColor(75, 85, 99)
  const texto = `Por su valiosa participación en la ${jornada?.edicion || '12va'} Jornada Académica y Cultural titulada:`
  doc.text(texto, cx, 135, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(27, 67, 50)
  const lema = `"${jornada?.lema || 'Cultura que inspira, conocimiento que transforma'}"`
  doc.text(lema, cx, 145, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(107, 114, 128)
  const fechaStr = `Llevada a cabo del ${new Date(jornada?.fecha_inicio + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })} al ${new Date(jornada?.fecha_fin + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}.`
  doc.text(fechaStr, cx, 155, { align: 'center' })

  // Firmas (Simuladas)
  doc.setDrawColor(200, 200, 200)
  doc.line(cx - 50, 185, cx + 50, 185)
  doc.setFontSize(10)
  doc.text('DIRECCIÓN ACADÉMICA', cx, 190, { align: 'center' })
  doc.text('UES SAN JOSÉ DEL RINCÓN', cx, 195, { align: 'center' })

  // Código de validación único
  const validCode = `VERIFY-${estudiante.id.slice(0,8)}-${jornada?.id.slice(0,4)}`.toUpperCase()
  doc.setFontSize(7)
  doc.setTextColor(200, 200, 200)
  doc.text(`Código de verificación: ${validCode}`, 20, 200)

  doc.save(`Constancia-${estudiante.nombre.replace(/\s+/g, '_')}-UESSJR.pdf`)
}

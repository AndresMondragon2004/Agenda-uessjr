import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, ChevronLeft, ChevronRight, Check, FileText, FileSpreadsheet, Filter } from 'lucide-react'
import { jornadaService } from '../../services/jornada.service'
import { sesionesService } from '../../services/sesiones.service'
import { estudiantesService } from '../../services/estudiantes.service'
import { propuestasService } from '../../services/propuestas.service'
import { supabase } from '../../services/supabase'

// ─── Constants ───────────────────────────────────────────────────────────────
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

const PROGRAMA_LABELS = {
  sistemas:            'Ing. sistemas',
  innovacion_agricola: 'Ing. innovación agrícola',
  contaduria:          'Contaduría',
  docente:             'Docente',
  externo:             'Externo',
}

const ESTADO_LABELS = {
  pendiente:  'Pendiente',
  contactada: 'Contactada',
  aprobada:   'Aprobada',
  rechazada:  'Rechazada',
}

// ─── PDF layout constants (landscape A4) ─────────────────────────────────────
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

// ─── PDF helpers ──────────────────────────────────────────────────────────────
function formatDayLong(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha + 'T12:00:00')
  const s = d.toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  return s.charAt(0).toUpperCase() + s.slice(1)
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

function drawPDFHeader(doc, jornada, dia, isContinuation, imgUES, imgUMB, incluyeLogos) {
  const cx = PAGE_W / 2
  doc.setDrawColor(27, 67, 50)
  doc.setLineWidth(1.5)
  doc.line(0, 0, PAGE_W, 0)
  
  if (incluyeLogos) {
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
  }
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

function drawPDFFooter(doc, logos, jornada, pageNum, totalPages, incluyeLogos) {
  const cx = PAGE_W / 2
  const fy = FOOTER_Y
  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.6)
  doc.line(MARGIN, fy, PAGE_W - MARGIN, fy)
  
  if (incluyeLogos) {
    const items   = logos.length > 0 ? logos.slice(0, 5) : []
    const spacing = 15 // Aumentado para más separación
    const totalW  = (items.length - 1) * spacing
    const startX  = cx - totalW / 2

    items.forEach((inst, i) => {
      const lx = startX + i * spacing
      if (inst.imgData) {
        // Dibujar imagen más ancha y con mejor espacio
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
  }
  const raw  = (jornada.lema || 'Cultura que inspira, conocimiento que transforma').replace(/^"|"$/g, '')
  const lema = `"${raw}"`
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7)
  doc.setTextColor(107, 114, 128)
  doc.text(lema, cx, fy + 14, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(180, 180, 180)
  doc.text(`${pageNum} / ${totalPages}`, PAGE_W - MARGIN, fy + 14, { align: 'right' })
}

function drawPDFPortada(doc, jornada, imgUES, imgUMB, logos, incluyeLogos) {
  const cx = PAGE_W / 2
  const cy = PAGE_H / 2
  doc.setFillColor(249, 247, 242)
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F')
  doc.setDrawColor(27, 67, 50)
  doc.setLineWidth(1.5)
  doc.line(0, 0, PAGE_W, 0)
  
  if (incluyeLogos) {
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
  }
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
  
  if (incluyeLogos) {
    const items   = logos.length > 0 ? logos.slice(0, 5) : []
    const spacing = 18 // Más separación en portada
    const totalW  = (items.length - 1) * spacing
    const startX  = cx - totalW / 2
    items.forEach((inst, i) => {
      const lx = startX + i * spacing
      if (inst.imgData) {
        doc.addImage(inst.imgData, 'PNG', lx - 7, fy + 2, 14, 9, undefined, 'FAST')
      } else {
        doc.setDrawColor(27, 67, 50)
        doc.setLineWidth(0.6)
        doc.setFillColor(249, 247, 242)
        doc.circle(lx, fy + 7, 3.5, 'FD')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(5)
        doc.setTextColor(27, 67, 50)
        doc.text(inst.nombre?.[0] || '?', lx, fy + 8.5, { align: 'center' })
      }
    })
  }
  const raw  = (jornada?.lema || 'Cultura que inspira, conocimiento que transforma').replace(/^"|"$/g, '')
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7)
  doc.setTextColor(107, 114, 128)
  doc.text(`"${raw}"`, cx, fy + 14, { align: 'center' })
}

function drawSessionsColumn(doc, sesiones, incluyePonentes, dia, incluyeDescripcion, incluyeMateriales) {
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
    if (incluyeDescripcion && ses.descripcion && nextY + 3 <= rowTop + rowH) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(130, 130, 130)
      const descLines = doc.splitTextToSize(ses.descripcion, SESSION_W)
      doc.text(descLines.slice(0, 1)[0] + (descLines.length > 1 ? '...' : ''), SESSION_X, nextY)
      nextY += 3.5
    }
    if (incluyeMateriales && ses.materiales_requeridos && nextY + 3 <= rowTop + rowH) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(6)
      doc.setTextColor(212, 160, 23)
      doc.text(`Materiales: ${ses.materiales_requeridos}`.slice(0, 90), SESSION_X, nextY)
      nextY += 3.5
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

// ─── CSV utils ────────────────────────────────────────────────────────────────
function toCSV(rows, headers) {
  const escape = (v) => {
    if (v == null) return ''
    const s = String(v)
    if (s.includes(',') || s.includes('"') || s.includes('\n'))
      return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
  ]
  return lines.join('\r\n')
}

function downloadCSV(content, filename) {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatShortDay(dia) {
  if (!dia) return '—'
  const d = new Date(dia.fecha + 'T12:00:00')
  const nombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  return `${nombres[d.getDay()]} ${d.getDate()}`
}

const IMAGENES_POR_DIA = {
  'Lunes':     '/images/imagenes_reporte/ajolote_lunes.jpg',
  'Martes':    '/images/imagenes_reporte/software_martes.jpg',
  'Miércoles': '/images/imagenes_reporte/manualidades_miercoles.jpg',
  'Jueves':    '/images/imagenes_reporte/computacion_jueves.jpg',
  'Viernes':   '/images/imagenes_reporte/robots_viernes.jpg',
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Reports() {
  const navigate = useNavigate()

  const [jornada,            setJornada]           = useState(null)
  const [sesiones,           setSesiones]          = useState([])
  const [loading,            setLoading]           = useState(true)
  const [diasSeleccionados,  setDiasSeleccionados] = useState('todos')
  const [incluyeLogos,       setIncluyeLogos]      = useState(true)
  const [incluyePonentes,    setIncluyePonentes]   = useState(true)
  const [incluyeDescripcion, setIncluyeDescripcion]= useState(false)
  const [incluyeMateriales,  setIncluyeMateriales] = useState(false)
  const [logos,              setLogos]             = useState([])
  const [generando,          setGenerando]         = useState(false)
  const [exportando,         setExportando]        = useState(null)
  const [toast,              setToast]             = useState(null)
  const [paginaPreview,      setPaginaPreview]     = useState(1)
  const [showModalImagenes,  setShowModalImagenes] = useState(false)
  const [loadingImagen,      setLoadingImagen]     = useState(null) // ID del día cargando

  const showToast = (msg, tipo = 'ok') => {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const j = await jornadaService.getActiva()
      setJornada(j)
      const ses = await sesionesService.getByJornada(j.id)
      setSesiones(ses || [])
      try {
        const { data } = await supabase.from('instituciones').select('*').order('orden')
        setLogos(data || [])
      } catch { /* tabla puede no existir */ }
    } catch {
      // sin jornada activa
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const sesionesFiltradas = diasSeleccionados === 'todos'
    ? sesiones
    : sesiones.filter(s => s.dia_jornada_id === diasSeleccionados)

  const dias = jornada?.dias_jornada?.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)) || []

  // Para el preview, las páginas son: portada + días filtrados
  const diasParaPDF = diasSeleccionados === 'todos' ? dias : dias.filter(d => d.id === diasSeleccionados)
  const totalPages      = 1 + Math.max(diasParaPDF.length, 1)
  const diaActualParaPreview = paginaPreview > 1 ? diasParaPDF[paginaPreview - 2] : null
  const sesionesDelDiaPreview = diaActualParaPreview 
    ? sesionesFiltradas.filter(s => s.dia_jornada_id === diaActualParaPreview.id)
    : []
  // Mostramos hasta 5 sesiones del día seleccionado en la vista previa
  const sesionesPreview = sesionesDelDiaPreview.slice(0, 5)

  // ── PDF generation ──────────────────────────────────────────────────────────
  const handleGenerarPDF = async () => {
    if (!jornada) { showToast('No hay jornada activa disponible', 'error'); return }
    if (sesionesFiltradas.length === 0) { showToast('No hay sesiones para generar el PDF', 'error'); return }
    try {
      setGenerando(true)
      const { jsPDF } = await import('jspdf')
      
      // Cargar logos fijos
      const [imgUES, imgUMB] = await Promise.all([
        tryLoadImage('/images/logos/ues-sjr.png'),
        tryLoadImage('/images/logos/umb.png'),
      ])

      // Cargar logos de instituciones (footer)
      const instLogos = await Promise.all(
        logos.slice(0, 5).map(l => tryLoadImage(l.logotipo_url))
      )

      // Combinar datos de imagen con los objetos de instituciones
      const logosConImagen = logos.slice(0, 5).map((l, i) => ({
        ...l,
        imgData: instLogos[i]
      }))

      // Días a incluir (filtrado)
      const diasAIncluir = diasSeleccionados === 'todos'
        ? [...dias].sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        : dias.filter(d => d.id === diasSeleccionados)

      // Cargar imágenes temáticas para cada día (Prioriza URL de BD, luego local)
      const imagenesTematicas = await Promise.all(
        diasAIncluir.map(d => {
          const path = d.imagen_url || IMAGENES_POR_DIA[d.nombre_dia]
          return path ? tryLoadImage(path) : Promise.resolve(null)
        })
      )

      const sesionesPorDia = {}
      diasAIncluir.forEach(d => { sesionesPorDia[d.id] = [] })
      sesionesFiltradas.forEach(s => {
        if (sesionesPorDia[s.dia_jornada_id]) sesionesPorDia[s.dia_jornada_id].push(s)
      })

      const totalPaginas = 1 + diasAIncluir.length
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' })

      drawPDFPortada(doc, jornada, imgUES, imgUMB, logosConImagen, incluyeLogos)

      let pageNum = 1
      diasAIncluir.forEach((dia, idx) => {
        doc.addPage()
        const sesDia = [...(sesionesPorDia[dia.id] || [])].sort(
          (a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || '')
        )
        doc.setFillColor(249, 247, 242)
        doc.rect(0, 0, PAGE_W, PAGE_H, 'F')
        drawPDFHeader(doc, jornada, dia, false, imgUES, imgUMB, incluyeLogos)
        drawSessionsColumn(doc, sesDia, incluyePonentes, dia, incluyeDescripcion, incluyeMateriales)
        drawPhotoPlaceholder(doc, imagenesTematicas[idx])
        drawPDFFooter(doc, logosConImagen, jornada, pageNum, totalPaginas - 1, incluyeLogos)
        pageNum++
      })

      const safeNombre = (jornada.nombre || 'Jornada').replace(/\s+/g, '-').replace(/[^\w-]/g, '')
      const sufijo = diasSeleccionados !== 'todos'
        ? `-${dias.find(d => d.id === diasSeleccionados)?.nombre_dia || 'dia'}`
        : ''
      doc.save(`Programa-${safeNombre}${sufijo}-UESSJR.pdf`)
      showToast('PDF generado y descargado exitosamente')
    } catch (err) {
      console.error('Error generando PDF:', err)
      showToast('Error al generar el PDF. Inténtalo de nuevo.', 'error')
    } finally {
      setGenerando(false)
    }
  }

  // ── Exportar lista de inscritos por sesión (CSV) ──────────────────────────
  const handleExportarInscritos = async () => {
    if (!jornada) { showToast('No hay jornada activa', 'error'); return }
    try {
      setExportando('inscritos')
      const { data, error } = await supabase
        .from('inscripciones')
        .select(`
          estudiantes(nombre, apellidos, matricula, correo, programa_academico),
          sesiones(nombre, tipo, hora_inicio, hora_fin,
            dias_jornada(fecha, nombre_dia),
            escenarios(nombre))
        `)
        .eq('estado', 'confirmada')

      if (error) throw error

      const rows = (data || [])
        .filter(r => r.sesiones)
        .map(r => ({
          'Nombre': `${r.estudiantes?.nombre || ''} ${r.estudiantes?.apellidos || ''}`.trim(),
          'Matrícula': r.estudiantes?.matricula || '',
          'Correo': r.estudiantes?.correo || '',
          'Programa': PROGRAMA_LABELS[r.estudiantes?.programa_academico] || r.estudiantes?.programa_academico || '',
          'Sesión': r.sesiones?.nombre || '',
          'Tipo': TIPO_LABELS[r.sesiones?.tipo] || r.sesiones?.tipo || '',
          'Día': r.sesiones?.dias_jornada?.nombre_dia || '',
          'Fecha': r.sesiones?.dias_jornada?.fecha || '',
          'Hora inicio': r.sesiones?.hora_inicio?.slice(0, 5) || '',
          'Hora fin': r.sesiones?.hora_fin?.slice(0, 5) || '',
          'Escenario': r.sesiones?.escenarios?.nombre || '',
        }))

      const headers = ['Nombre','Matrícula','Correo','Programa','Sesión','Tipo','Día','Fecha','Hora inicio','Hora fin','Escenario']
      downloadCSV(toCSV(rows, headers), `Inscritos-${jornada.nombre || 'Jornada'}.csv`)
      showToast(`${rows.length} registros exportados`)
    } catch (err) {
      showToast('Error exportando inscritos: ' + err.message, 'error')
    } finally {
      setExportando(null)
    }
  }

  // ── Exportar estudiantes registrados (CSV) ────────────────────────────────
  const handleExportarEstudiantes = async () => {
    try {
      setExportando('estudiantes')
      const data = await estudiantesService.getAll()
      const rows = (data || []).map(e => ({
        'Nombre': `${e.nombre || ''} ${e.apellidos || ''}`.trim(),
        'Matrícula': e.matricula || '',
        'Correo': e.correo || '',
        'Programa': PROGRAMA_LABELS[e.programa_academico] || e.programa_academico || '',
        'Fecha de registro': e.created_at ? new Date(e.created_at).toLocaleDateString('es-MX') : '',
      }))
      const headers = ['Nombre','Matrícula','Correo','Programa','Fecha de registro']
      downloadCSV(toCSV(rows, headers), 'Estudiantes-UESSJR.csv')
      showToast(`${rows.length} estudiantes exportados`)
    } catch (err) {
      showToast('Error exportando estudiantes: ' + err.message, 'error')
    } finally {
      setExportando(null)
    }
  }

  // ── Exportar resumen por programa académico (CSV) ─────────────────────────
  const handleExportarResumenPrograma = async () => {
    if (!jornada) { showToast('No hay jornada activa', 'error'); return }
    try {
      setExportando('programa')
      const { data, error } = await supabase
        .from('inscripciones')
        .select(`
          sesiones(nombre, tipo, dias_jornada(nombre_dia)),
          estudiantes(programa_academico)
        `)
        .eq('estado', 'confirmada')
      if (error) throw error

      // Contar inscritos por programa y por tipo de sesión
      const resumen = {}
      const programas = Object.keys(PROGRAMA_LABELS)
      programas.forEach(p => {
        resumen[p] = { programa: PROGRAMA_LABELS[p], total: 0 }
        Object.keys(TIPO_LABELS).forEach(t => { resumen[p][t] = 0 })
      })
      resumen['otro'] = { programa: 'Otro / Externo', total: 0 }

      ;(data || []).forEach(r => {
        const prog = r.estudiantes?.programa_academico || 'otro'
        const key  = resumen[prog] ? prog : 'otro'
        resumen[key].total++
        const tipo = r.sesiones?.tipo
        if (tipo && resumen[key][tipo] !== undefined) resumen[key][tipo]++
      })

      const headers = ['programa', 'total', ...Object.keys(TIPO_LABELS)]
      const rows = Object.values(resumen).filter(r => r.total > 0)
      downloadCSV(toCSV(rows, headers), 'Resumen-por-programa-UESSJR.csv')
      showToast(`Resumen exportado (${rows.length} programas)`)
    } catch (err) {
      showToast('Error exportando resumen: ' + err.message, 'error')
    } finally {
      setExportando(null)
    }
  }

  // ── Exportar propuestas (CSV) ──────────────────────────────────────────────
  const handleExportarPropuestas = async () => {
    try {
      setExportando('propuestas')
      const data = await propuestasService.getAll()
      const rows = (data || []).map(p => ({
        'Proponente': p.nombre_proponente || '',
        'Correo': p.correo || '',
        'Teléfono': p.telefono || '',
        'Relación': p.relacion_institucion || '',
        'Tipo': TIPO_LABELS[p.tipo] || p.tipo || '',
        'Título': p.titulo || '',
        'Descripción': p.descripcion || '',
        'Duración': p.duracion || '',
        'Estado': ESTADO_LABELS[p.estado] || p.estado || '',
        'Horario preferido': p.horario_preferido || '',
        'Días disponibles': (p.dias_disponibles || []).join(', '),
        'Requiere materiales': p.requiere_materiales ? 'Sí' : 'No',
        'Fecha de envío': p.created_at ? new Date(p.created_at).toLocaleDateString('es-MX') : '',
      }))
      const headers = ['Proponente','Correo','Teléfono','Relación','Tipo','Título','Descripción','Duración','Estado','Horario preferido','Días disponibles','Requiere materiales','Fecha de envío']
      downloadCSV(toCSV(rows, headers), 'Propuestas-UESSJR.csv')
      showToast(`${rows.length} propuestas exportadas`)
    } catch (err) {
      showToast('Error exportando propuestas: ' + err.message, 'error')
    } finally {
      setExportando(null)
    }
  }

  // ── Exportar lista de inscritos por sesión individual (CSV) ───────────────
  const handleExportarInscritosPorSesion = async () => {
    if (!jornada) { showToast('No hay jornada activa', 'error'); return }
    try {
      setExportando('inscritos-sesion')
      const sesFiltradas = sesionesFiltradas.filter(s => s.estado !== 'cancelada')

      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
      const PW = 210
      const PM = 15

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(27, 67, 50)
      doc.text('Lista de asistencia por sesión', PW / 2, 20, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(107, 114, 128)
      doc.text(jornada.nombre || '', PW / 2, 27, { align: 'center' })

      let y = 38

      for (const ses of sesFiltradas) {
        const { data: inscritos } = await supabase
          .from('inscripciones')
          .select('estudiantes(nombre, apellidos, matricula, programa_academico)')
          .eq('sesion_id', ses.id)
          .eq('estado', 'confirmada')

        const lista = (inscritos || []).map(i => i.estudiantes).filter(Boolean)

        if (y + 30 > 280) {
          doc.addPage()
          y = 20
        }

        // Encabezado sesión
        doc.setFillColor(27, 67, 50)
        doc.rect(PM, y, PW - PM * 2, 8, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(255, 255, 255)
        doc.text(ses.nombre || 'Sin nombre', PM + 3, y + 5.5)
        doc.text(
          `${ses.hora_inicio?.slice(0, 5) || ''} — ${ses.hora_fin?.slice(0, 5) || ''} | ${ses.escenarios?.nombre || ''}`,
          PW - PM - 3, y + 5.5, { align: 'right' }
        )
        y += 10

        if (lista.length === 0) {
          doc.setFont('helvetica', 'italic')
          doc.setFontSize(8)
          doc.setTextColor(150, 150, 150)
          doc.text('Sin inscripciones', PM + 3, y + 4)
          y += 10
        } else {
          // Encabezado tabla
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(7)
          doc.setTextColor(80, 80, 80)
          doc.text('#', PM + 2, y + 4)
          doc.text('Nombre', PM + 10, y + 4)
          doc.text('Matrícula', PM + 90, y + 4)
          doc.text('Programa', PM + 120, y + 4)
          doc.text('Firma', PW - PM - 25, y + 4)
          y += 7

          lista.forEach((est, idx) => {
            if (y > 275) { doc.addPage(); y = 20 }
            const bg = idx % 2 === 0 ? [250, 250, 250] : [255, 255, 255]
            doc.setFillColor(...bg)
            doc.rect(PM, y - 1, PW - PM * 2, 6.5, 'F')
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(7)
            doc.setTextColor(30, 30, 30)
            doc.text(String(idx + 1), PM + 2, y + 3.5)
            doc.text(`${est.nombre || ''} ${est.apellidos || ''}`.trim().slice(0, 38), PM + 10, y + 3.5)
            doc.text(est.matricula || '—', PM + 90, y + 3.5)
            doc.text(PROGRAMA_LABELS[est.programa_academico]?.slice(0, 20) || '—', PM + 120, y + 3.5)
            // Línea para firma
            doc.setDrawColor(200, 200, 200)
            doc.setLineWidth(0.3)
            doc.line(PW - PM - 35, y + 5, PW - PM, y + 5)
            y += 6.5
          })
          // Total
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(7)
          doc.setTextColor(27, 67, 50)
          doc.text(`Total inscritos: ${lista.length}`, PM + 3, y + 4)
          y += 10
        }
        y += 4
      }

      const safeNombre = (jornada.nombre || 'Jornada').replace(/\s+/g, '-').replace(/[^\w-]/g, '')
      const sufijo = diasSeleccionados !== 'todos'
        ? `-${dias.find(d => d.id === diasSeleccionados)?.nombre_dia || 'dia'}`
        : ''
      doc.save(`Programa-${safeNombre}${sufijo}-UESSJR.pdf`)
      showToast('PDF generado y descargado exitosamente')
    } catch (err) {
      console.error('Error generando PDF:', err)
      showToast('Error al generar el PDF. Inténtalo de nuevo.', 'error')
    } finally {
      setGenerando(false)
    }
  }
// ── Exportar Reporte Maestro de Asistencia (CSV) ─────────────────────────
const handleExportarMaestroAsistencia = async () => {
  if (!jornada) { showToast('No hay jornada activa', 'error'); return }
  try {
    setExportando('maestro')

    // 1. Obtener todas las sesiones activas de esta jornada
    const { data: ses } = await supabase
      .from('sesiones')
      .select('id')
      .eq('jornada_id', jornada.id)
      .eq('estado', 'activa')
    const totalSesiones = ses?.length || 0

    // 2. Obtener todos los estudiantes registrados
    const { data: ests } = await supabase
      .from('estudiantes')
      .select('id, nombre, apellidos, matricula, correo, programa_academico')

    // 3. Obtener todas las asistencias de esta jornada
    const { data: asist } = await supabase
      .from('asistencias')
      .select('estudiante_id, sesion_id')
      .in('sesion_id', ses?.map(s => s.id) || [])

    // 4. Mapear datos
    const rows = (ests || []).map(e => {
      const misAsistencias = (asist || []).filter(a => a.estudiante_id === e.id).length
      return {
        'Nombre': `${e.nombre} ${e.apellidos}`.trim(),
        'Matrícula': e.matricula || '',
        'Carrera': PROGRAMA_LABELS[e.programa_academico] || e.programa_academico || '',
        'Correo': e.correo || '',
        'Sesiones Asistidas': misAsistencias,
        'Total Sesiones Jornada': totalSesiones,
        '% Cumplimiento': totalSesiones > 0 ? Math.round((misAsistencias / totalSesiones) * 100) + '%' : '0%'
      }
    })

    const headers = ['Nombre','Matrícula','Carrera','Correo','Sesiones Asistidas','Total Sesiones Jornada','% Cumplimiento']
    downloadCSV(toCSV(rows, headers), `Reporte-Maestro-Asistencia-${jornada.nombre}.csv`)
    showToast(`${rows.length} estudiantes procesados`)
  } catch (err) {
    showToast('Error: ' + err.message, 'error')
  } finally {
    setExportando(null)
  }
}

const EXPORT_ROWS = [
  { key: 'maestro', label: 'Reporte maestro de asistencia', format: 'CSV', desc: 'Métrica individual de asistencia real por cada alumno registrado.', fn: handleExportarMaestroAsistencia },
  { key: 'inscritos', label: 'Inscripciones por sesión', format: 'CSV', desc: 'Listado de todos los confirmados en cada sesión.', fn: handleExportarInscritos },
  { key: 'estudiantes', label: 'Censo estudiantil', format: 'CSV', desc: 'Base de datos de estudiantes registrados en el sistema.', fn: handleExportarEstudiantes },
  { key: 'programa', label: 'Métrica por carrera', format: 'CSV', desc: 'Resumen cuantitativo por programa académico.', fn: handleExportarResumenPrograma },
  { key: 'propuestas', label: 'Banco de propuestas', format: 'CSV', desc: 'Historial de actividades propuestas por ponentes.', fn: handleExportarPropuestas },
  { key: 'inscritos-sesion', label: 'Listas de asistencia', format: 'PDF', desc: 'Documentos imprimibles para control de firmas.', fn: handleExportarInscritosPorSesion },
]

  // ... (handleExportarInscritosPorSesion and other export functions)

  const handleUploadImagenDia = async (diaId, file) => {
    if (!file) return
    try {
      setLoadingImagen(diaId)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-dia-${diaId}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName)

      const { error: dbError } = await supabase
        .from('dias_jornada')
        .update({ imagen_url: publicUrl })
        .eq('id', diaId)
      
      if (dbError) {
        if (dbError.code === 'PGRST204' || dbError.message.includes('imagen_url')) {
          throw new Error('La base de datos no tiene la columna imagen_url. Por favor, ejecuta el script SQL.')
        }
        throw dbError
      }

      showToast('Imagen actualizada correctamente')
      cargarDatos()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoadingImagen(null)
    }
  }

  const handleUploadLogo = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`
      const filePath = fileName

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath)

      const { error: dbError } = await supabase
        .from('instituciones')
        .insert([{
          nombre: file.name.split('.')[0],
          logotipo_url: publicUrl,
          orden: logos.length
        }])

      if (dbError) throw dbError

      cargarDatos()
      showToast('Logo institucional añadido correctamente')
    } catch (err) {
      showToast('Error al subir logo: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLogo = async (id, url) => {
    if (!confirm('¿Estás seguro de eliminar este logo?')) return

    try {
      setLoading(true)
      
      if (url && url.includes('/storage/v1/object/public/logos/')) {
        const filePath = url.split('/logos/')[1]
        await supabase.storage.from('logos').remove([filePath])
      }

      const { error } = await supabase
        .from('instituciones')
        .delete()
        .eq('id', id)

      if (error) throw error

      cargarDatos()
      showToast('Logo eliminado')
    } catch (err) {
      showToast('Error al eliminar: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const FORMAT_COLORS = {
    PDF: 'bg-red-50 text-red-600 border-red-100',
    CSV: 'bg-blue-50 text-blue-600 border-blue-100',
  }

  return (
    <>
      {/* Topbar */}
      <div className="bg-white dark:bg-[#122A1C] border-b border-gray-100 dark:border-emerald-900/40 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-14 lg:top-0 z-10">
        <h1 className="font-black text-xl text-gray-900 dark:text-gray-100 tracking-tight">Reportes y exportación</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1B4332] mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Preparando base de datos...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* ══ COLUMNA IZQUIERDA: Configuraciones ══ */}
            <div className="lg:col-span-3 space-y-6">

              {/* Card 1 — Programa oficial */}
              <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-sm p-8 border border-gray-100 dark:border-emerald-900/40">
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/40 rounded-lg">
                    <FileText className="w-5 h-5 text-[#1B4332] dark:text-emerald-400" />
                  </div>
                  <h2 className="font-black text-lg text-gray-900 dark:text-gray-100">Programa oficial</h2>
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-8 ml-12">
                  Configura y genera el programa de actividades en formato PDF.
                </p>

                {/* Filtro por día */}
                <div className="mb-8">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Filter className="w-3 h-3" /> 1. Seleccionar cobertura
                  </p>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button type="button"
                      onClick={() => { setDiasSeleccionados('todos'); setPaginaPreview(1) }}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm
                        ${diasSeleccionados === 'todos'
                          ? 'bg-[#1B4332] text-white'
                          : 'bg-white dark:bg-[#0F2018] border border-gray-200 dark:border-emerald-900/40 text-gray-600 dark:text-gray-300 hover:border-[#1B4332]/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'}`}>
                      Evento completo
                    </button>
                    {dias.map(dia => (
                      <button key={dia.id} type="button"
                        onClick={() => { setDiasSeleccionados(dia.id); setPaginaPreview(1) }}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm
                          ${diasSeleccionados === dia.id
                            ? 'bg-[#1B4332] text-white'
                            : 'bg-white dark:bg-[#0F2018] border border-gray-200 dark:border-emerald-900/40 text-gray-600 dark:text-gray-300 hover:border-[#1B4332]/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'}`}>
                        {formatShortDay(dia)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Checklist de contenido */}
                <div className="mb-8">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">2. Contenido del documento</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { checked: incluyeLogos,       set: setIncluyeLogos,       label: 'Identidad institucional',     desc: 'Escudos UES y UMB' },
                      { checked: incluyePonentes,    set: setIncluyePonentes,    label: 'Perfiles de ponentes', desc: 'Grados y nombres' },
                      { checked: incluyeDescripcion, set: setIncluyeDescripcion, label: 'Sinopsis de actividades',    desc: 'Descripción completa' },
                      { checked: incluyeMateriales,  set: setIncluyeMateriales,  label: 'Materiales especiales',       desc: 'Requerimientos técnicos' },
                    ].map((item, i) => (
                      <label key={i} className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 dark:border-emerald-900/40 hover:border-emerald-100 dark:hover:border-emerald-800/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/20 transition-all cursor-pointer group">
                        <div className={`mt-0.5 flex shrink-0 items-center justify-center w-5 h-5 rounded-lg border-2 transition-all
                          ${item.checked ? 'bg-[#1B4332] border-[#1B4332]' : 'border-gray-200 dark:border-emerald-900/60 bg-white dark:bg-[#0F2018] group-hover:border-[#1B4332]/50'}`}>
                          {item.checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
                        </div>
                        <input type="checkbox" checked={item.checked} onChange={() => item.set(!item.checked)} className="sr-only" />
                        <div>
                          <p className="text-sm text-gray-800 dark:text-gray-200 font-bold group-hover:text-[#1B4332] dark:group-hover:text-emerald-400 transition-colors">{item.label}</p>
                          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 leading-tight">{item.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-[#0F2018] rounded-2xl p-6 mb-8 flex items-center justify-between border border-gray-100 dark:border-emerald-900/40">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Destino del reporte</p>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{jornada?.nombre || 'Jornada Académica'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Total de páginas</p>
                    <p className="text-sm font-black text-[#1B4332] dark:text-emerald-400">{totalPages}</p>
                  </div>
                </div>

                <button type="button" onClick={handleGenerarPDF} disabled={generando}
                  className="w-full py-4 text-white font-black uppercase tracking-widest rounded-2xl bg-[#1B4332] hover:bg-[#002F1D] hover:-translate-y-0.5 transition-all shadow-lg shadow-emerald-900/10 disabled:opacity-50 flex items-center justify-center gap-3">
                  {generando ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-b-white" />
                      Procesando PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Generar Documento Maestro
                    </>
                  )}
                </button>
              </div>

              {/* Card 2 — Otros reportes */}
              <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-sm p-8 border border-gray-100 dark:border-emerald-900/40">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="font-black text-lg text-gray-900 dark:text-gray-100">Métricas y datos crudos</h2>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {EXPORT_ROWS.map((row) => (
                    <div key={row.key} className="flex items-center justify-between p-4 border border-gray-50 dark:border-emerald-900/30 rounded-2xl hover:border-emerald-100 dark:hover:border-emerald-800/50 hover:bg-gray-50/50 dark:hover:bg-emerald-900/10 transition-all group">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="shrink-0 mt-1">
                          {row.format === 'PDF'
                            ? <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg"><FileText className="w-4 h-4 text-red-500 dark:text-red-400" /></div>
                            : <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"><FileSpreadsheet className="w-4 h-4 text-blue-500 dark:text-blue-400" /></div>
                          }
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="text-sm text-gray-800 dark:text-gray-200 font-black group-hover:text-[#1B4332] dark:group-hover:text-emerald-400 transition-colors">{row.label}</p>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 ${FORMAT_COLORS[row.format] || 'bg-gray-100 text-gray-600'}`}>
                              {row.format}
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">{row.desc}</p>
                        </div>
                      </div>
                      <button type="button"
                        onClick={row.fn}
                        disabled={!!exportando}
                        className="shrink-0 ml-4 px-5 py-2 text-xs font-black uppercase tracking-wider text-[#1B4332] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl hover:bg-[#1B4332] dark:hover:bg-[#1B4332] hover:text-white transition-all disabled:opacity-40 min-w-[110px] border border-transparent hover:shadow-md">
                        {exportando === row.key ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-b-transparent mx-auto" />
                        ) : (
                          'Exportar'
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logos institucionales */}
              <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-sm p-8 border border-gray-100 dark:border-emerald-900/40">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-black text-lg text-gray-900 dark:text-gray-100">Activos institucionales</h2>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <button 
                      onClick={() => setShowModalImagenes(true)}
                      className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2">
                      <Filter className="w-3 h-3" />
                      Imágenes del Programa
                    </button>
                    <label className="cursor-pointer px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-[#1B4332] dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#1B4332] hover:text-white dark:hover:bg-emerald-700 transition-all flex items-center gap-2">
                      <Download className="w-3 h-3 rotate-180" />
                      Cargar Logo
                      <input type="file" className="hidden" accept="image/*" onChange={handleUploadLogo} />
                    </label>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {logos.map(logo => (
                    <div key={logo.id} className="bg-gray-50 dark:bg-[#0F2018] rounded-2xl p-4 text-center group border border-transparent hover:border-red-100 dark:hover:border-red-900/40 transition-all relative">
                      <button 
                        onClick={() => handleDeleteLogo(logo.id, logo.logotipo_url)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600">
                        <span className="text-[10px] font-bold">×</span>
                      </button>
                      {logo.logotipo_url ? (
                        <img src={logo.logotipo_url} alt={logo.nombre} className="h-10 mx-auto object-contain mb-2 grayscale group-hover:grayscale-0 transition-all" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#122A1C] border border-gray-200 dark:border-emerald-900/40 flex items-center justify-center mx-auto mb-2">
                          <span className="text-gray-300 dark:text-gray-600 font-black text-lg">{logo.nombre?.[0] || '?'}</span>
                        </div>
                      )}
                      <p className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-tight truncate">{logo.nombre}</p>
                    </div>
                  ))}
                  {logos.length === 0 && (
                    <div className="col-span-full py-8 text-center border-2 border-dashed border-gray-100 dark:border-emerald-900/30 rounded-2xl">
                      <p className="text-[10px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-widest">No hay logos cargados</p>
                    </div>
                  )}
                </div>
                <p className="mt-4 text-[10px] font-medium text-gray-400 dark:text-gray-500 italic">
                  * Estos logos aparecerán automáticamente en el pie de página del reporte PDF.
                </p>
              </div>
            </div>

            {/* ══ COLUMNA DERECHA: Vista Previa ══ */}
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-24 space-y-6">
                <div className="bg-white dark:bg-[#122A1C] rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-emerald-900/40 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4">
                    <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-full">Preview en vivo</span>
                  </div>
                  <h3 className="font-black text-sm text-gray-900 dark:text-gray-100 mb-6 uppercase tracking-widest">Maquetación del documento</h3>

                  {/* Mock PDF */}
                  <div className="w-full rounded-2xl overflow-hidden border border-gray-200 shadow-2xl shadow-emerald-900/5 transition-all transform hover:scale-[1.02]"
                       style={{ background: '#F9F7F2', aspectRatio: '297/210' }}>

                    {paginaPreview === 1 ? (
                      <div className="w-full h-full flex flex-col p-4" style={{ background: '#F9F7F2' }}>
                        <div className="flex items-center justify-between border-b-2 border-[#1B4332] pb-2 mb-4">
                          <div className="w-12 h-8 flex items-center justify-center">
                            {incluyeLogos && <img src="/images/logos/umb.png" alt="UMB" className="max-h-full object-contain opacity-40" onError={(e) => e.target.style.display='none'} />}
                          </div>
                          <p className="text-[8px] font-black text-[#1B4332] tracking-widest">UES SAN JOSÉ DEL RINCÓN</p>
                          <div className="w-12 h-8 flex items-center justify-center">
                            {incluyeLogos && <img src="/images/logos/ues-sjr.png" alt="UES" className="max-h-full object-contain opacity-40" onError={(e) => e.target.style.display='none'} />}
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                          <div className="w-1 bg-[#D4A017] h-8 mb-4 rounded-full" />
                          <h4 className="text-sm font-black text-[#1B4332] uppercase tracking-tighter leading-none">Jornada Académica</h4>
                          <h4 className="text-sm font-black text-[#1B4332] uppercase tracking-tighter leading-none mb-2">y Cultural 2026</h4>
                          <p className="text-[6px] font-black text-gray-400 tracking-[0.3em] mb-4">P R O G R A M A</p>
                          <div className="px-3 py-1 bg-[#1B4332] text-white text-[7px] font-black rounded-lg">
                            {jornada?.periodo || '4 al 8 de mayo'}
                          </div>
                        </div>
                        <div className="border-t border-gray-100 pt-4 mt-auto flex flex-col items-center gap-2">
                          <div className="flex gap-3">
                            {incluyeLogos && logos.slice(0, 5).map(logo => (
                              <div key={logo.id} className="w-5 h-5 rounded-full border border-gray-100 overflow-hidden bg-white flex items-center justify-center">
                                {logo.logotipo_url ? (
                                  <img src={logo.logotipo_url} alt={logo.nombre} className="w-full h-full object-contain p-0.5" />
                                ) : (
                                  <span className="text-[4px] font-bold">{logo.nombre?.[0]}</span>
                                )}
                              </div>
                            ))}
                            {incluyeLogos && logos.length === 0 && [1,2,3,4].map(i => <div key={i} className="w-4 h-4 rounded-full border border-gray-100" />)}
                          </div>
                          <p className="text-[6px] text-gray-400 italic">"{jornada?.lema || 'Cultura que inspira...'}"</p>
                        </div>
                      </div>

                    ) : (
                      <div className="w-full h-full flex flex-col p-4" style={{ background: '#F9F7F2' }}>
                        <div className="flex items-center justify-between border-b border-[#D4A017] pb-2 mb-4">
                          <div className="text-left flex-1">
                            <p className="text-[8px] font-black text-[#1B4332]">UES SJR</p>
                            <p className="text-[6px] font-bold text-gray-400 uppercase truncate max-w-[100px]">{jornada?.nombre}</p>
                          </div>
                          <div className="text-center px-4">
                            <p className="text-[7px] font-black text-[#D4A017] uppercase tracking-widest">
                              {diasParaPDF[paginaPreview - 2] ? formatShortDay(diasParaPDF[paginaPreview - 2]) : '—'}
                            </p>
                          </div>
                          <div className="flex-1 text-right">
                             <p className="text-[6px] text-gray-300">Pág. {paginaPreview - 1}</p>
                          </div>
                        </div>

                        <div className="flex flex-1 gap-4 overflow-hidden">
                          <div className="flex flex-col" style={{ width: '65%' }}>
                            <div className="flex gap-4 border-b border-gray-200 pb-1 mb-2">
                              <span className="text-[5px] font-black text-gray-400 uppercase tracking-widest w-8">Hora</span>
                              <span className="text-[5px] font-black text-gray-400 uppercase tracking-widest">Actividad</span>
                            </div>
                            <div className="space-y-3">
                              {sesionesPreview.length > 0 ? sesionesPreview.map((ses) => (
                                <div key={ses.id} className="flex gap-4 items-start opacity-80 border-b border-gray-50 pb-2">
                                  <span className="text-[6px] font-black text-[#1B4332] w-8">{ses.hora_inicio?.slice(0, 5)}</span>
                                  <div className="flex-1">
                                    <p className="text-[7px] font-black text-gray-800 leading-tight mb-0.5">{ses.nombre.slice(0, 45)}...</p>
                                    {incluyePonentes && ses.ponente_nombre && (
                                      <p className="text-[5px] font-bold text-gray-400 mb-0.5">{ses.ponente_nombre}</p>
                                    )}
                                    {incluyeDescripcion && ses.descripcion && (
                                      <p className="text-[4.5px] text-gray-400 mb-0.5">{ses.descripcion.slice(0, 80)}...</p>
                                    )}
                                    {incluyeMateriales && ses.materiales_requeridos && (
                                      <p className="text-[4.5px] italic text-[#D4A017]">Mat: {ses.materiales_requeridos.slice(0, 60)}</p>
                                    )}
                                  </div>
                                </div>
                              )) : <p className="text-[8px] text-gray-300 text-center py-8">Sin actividades</p>}
                            </div>
                          </div>
                          <div className="flex-1 rounded-xl overflow-hidden border border-emerald-100 bg-emerald-50 relative group">
                             {diaActualParaPreview && (diaActualParaPreview.imagen_url || IMAGENES_POR_DIA[diaActualParaPreview.nombre_dia]) ? (
                               <img 
                                 src={diaActualParaPreview.imagen_url || IMAGENES_POR_DIA[diaActualParaPreview.nombre_dia]} 
                                 className="w-full h-full object-cover"
                                 alt="Thematic" 
                               />
                             ) : (
                               <div className="w-full h-full flex flex-col items-center justify-center p-4">
                                 <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm mb-2">
                                   <FileText className="w-4 h-4 text-emerald-200" />
                                 </div>
                                 <p className="text-[6px] font-black text-emerald-300 uppercase tracking-widest text-center">Sin imagen configurada</p>
                               </div>
                             )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Paginación Preview */}
                  <div className="flex items-center justify-between mt-6 bg-gray-50 dark:bg-[#0F2018] p-2 rounded-2xl border border-gray-100 dark:border-emerald-900/30">
                    <button type="button" disabled={paginaPreview <= 1}
                      onClick={() => setPaginaPreview(p => p - 1)}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-[#1B4332] dark:hover:text-emerald-400 disabled:opacity-20 transition-all">
                      <ChevronLeft className="w-5 h-5" strokeWidth={3} />
                    </button>
                    <span className="text-[10px] font-black text-[#1B4332] dark:text-emerald-400 uppercase tracking-widest">
                      {paginaPreview === 1 ? 'Portada' : `Página ${paginaPreview - 1} / ${totalPages - 1}`}
                    </span>
                    <button type="button" disabled={paginaPreview >= totalPages}
                      onClick={() => setPaginaPreview(p => p + 1)}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-[#1B4332] dark:hover:text-emerald-400 disabled:opacity-20 transition-all">
                      <ChevronRight className="w-5 h-5" strokeWidth={3} />
                    </button>
                  </div>
                </div>

                {/* Info banner */}
                {diasSeleccionados !== 'todos' && (
                  <div className="bg-[#1B4332] rounded-2xl p-6 text-white shadow-xl shadow-emerald-900/10">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-white/10 rounded-lg">
                        <Check className="w-4 h-4 text-emerald-300" strokeWidth={4} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest mb-1">Filtro Inteligente</p>
                        <p className="text-sm font-medium text-emerald-50">Estás generando el programa exclusivamente para el {dias.find(d => d.id === diasSeleccionados)?.nombre_dia}.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Gestión de Imágenes de Programa */}
      {showModalImagenes && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#122A1C] w-full max-w-2xl rounded-3xl shadow-2xl border border-emerald-100 dark:border-emerald-900/40 overflow-hidden scale-in-center">
            <div className="p-6 border-b border-gray-100 dark:border-emerald-900/40 flex items-center justify-between bg-gray-50/50 dark:bg-emerald-900/20">
              <div>
                <h3 className="font-black text-lg text-[#1B4332] dark:text-emerald-400 uppercase tracking-tight">Imágenes del Programa</h3>
                <p className="text-xs text-gray-500 font-bold">Personaliza la zona visual de cada día en el PDF.</p>
              </div>
              <button 
                onClick={() => setShowModalImagenes(false)}
                className="w-10 h-10 rounded-full hover:bg-white dark:hover:bg-emerald-800 transition-all flex items-center justify-center text-gray-400 hover:text-red-500">
                <span className="text-2xl font-light">×</span>
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-100 scrollbar-track-transparent">
              {dias.map((dia) => (
                <div key={dia.id} className="flex items-center gap-6 p-4 rounded-2xl border border-gray-100 dark:border-emerald-900/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-all group">
                  <div className="w-24 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-[#0F2018] shrink-0 border border-gray-200 dark:border-emerald-900/40 relative">
                    {(dia.imagen_url || IMAGENES_POR_DIA[dia.nombre_dia]) ? (
                      <img src={dia.imagen_url || IMAGENES_POR_DIA[dia.nombre_dia]} className="w-full h-full object-cover" alt={dia.nombre_dia} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-300 uppercase tracking-widest">N/A</div>
                    )}
                    {loadingImagen === dia.id && (
                      <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#1B4332] border-b-transparent" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm font-black text-gray-800 dark:text-gray-200">{dia.nombre_dia}</p>
                    <p className="text-[10px] font-bold text-gray-400">{new Date(dia.fecha + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}</p>
                  </div>

                  <label className="cursor-pointer px-4 py-2 bg-white dark:bg-[#0F2018] border border-gray-200 dark:border-emerald-900/60 text-[#1B4332] dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-[#1B4332] transition-all flex items-center gap-2 shadow-sm">
                    {dia.imagen_url ? 'Cambiar' : 'Subir'}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => handleUploadImagenDia(dia.id, e.target.files?.[0])}
                      disabled={loadingImagen === dia.id}
                    />
                  </label>
                </div>
              ))}
            </div>

            <div className="p-6 bg-gray-50 dark:bg-emerald-900/20 text-right">
              <button 
                onClick={() => setShowModalImagenes(false)}
                className="px-8 py-3 bg-[#1B4332] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-[#002F1D] shadow-lg shadow-emerald-900/10 transition-all">
                Cerrar Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notificación */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 px-8 py-4 rounded-2xl shadow-2xl text-sm font-black text-white flex items-center gap-3 animate-slide-up
          ${toast.tipo === 'error' ? 'bg-red-600' : 'bg-[#1B4332]'}`}>
          {toast.tipo === 'error' ? '✗' : <Check className="w-4 h-4" strokeWidth={4} />}
          {toast.msg}
        </div>
      )}
    </>
  )
}

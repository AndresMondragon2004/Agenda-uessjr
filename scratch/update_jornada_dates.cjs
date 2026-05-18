const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ydcybysimlvatvadpbaz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY3lieXNpbWx2YXR2YWRwYmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTU3MDAsImV4cCI6MjA5Mjg5MTcwMH0.IkwXKJkmJiArWyOToTURtAS1RpmcDCHa7cgF2gYX-PY'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function updateJornada() {
  // 1. Get current active jornada
  const { data: jornada, error: jError } = await supabase
    .from('jornadas')
    .select('*, dias_jornada(*)')
    .eq('estado', 'activa')
    .single()
  
  if (jError) {
    console.error('Error fetching active jornada:', jError)
    return
  }
  
  console.log('Current Active Jornada:', jornada.nombre)
  
  // 2. Update Jornada details
  const today = new Date('2026-05-04T12:00:00')
  const numDays = (jornada.dias_jornada && jornada.dias_jornada.length > 0) ? jornada.dias_jornada.length : 5
  const endDate = new Date(today)
  endDate.setDate(today.getDate() + numDays - 1)
  
  const fechaInicioStr = today.toISOString().split('T')[0]
  const fechaFinStr = endDate.toISOString().split('T')[0]
  
  const updatedNombre = jornada.nombre.replace(/202[0-9]/g, '2026')
  
  console.log('Updating to:', { updatedNombre, fechaInicioStr, fechaFinStr })
  
  const { error: updateError } = await supabase
    .from('jornadas')
    .update({
      nombre: updatedNombre,
      fecha_inicio: fechaInicioStr,
      fecha_fin: fechaFinStr
    })
    .eq('id', jornada.id)
  
  if (updateError) {
    console.error('Error updating jornada:', updateError)
    return
  }
  
  // 3. Update Days
  console.log('Updating days...')
  const diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  
  // Sort current days by date to maintain order if possible
  const currentDias = jornada.dias_jornada.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
  
  for (let i = 0; i < currentDias.length; i++) {
    const newDate = new Date(today)
    newDate.setDate(today.getDate() + i)
    const newDateStr = newDate.toISOString().split('T')[0]
    const newNombreDia = diasNombres[newDate.getDay()]
    
    console.log(`Day ${i+1}: ${currentDias[i].fecha} -> ${newDateStr} (${newNombreDia})`)
    
    const { error: diaError } = await supabase
      .from('dias_jornada')
      .update({
        fecha: newDateStr,
        nombre_dia: newNombreDia
      })
      .eq('id', currentDias[i].id)
    
    if (diaError) {
      console.error(`Error updating day ${currentDias[i].id}:`, diaError)
    }
  }
  
  console.log('Jornada and days updated successfully!')
}

updateJornada()

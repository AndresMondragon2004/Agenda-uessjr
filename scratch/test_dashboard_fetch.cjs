const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ydcybysimlvatvadpbaz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY3lieXNpbWx2YXR2YWRwYmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTU3MDAsImV4cCI6MjA5Mjg5MTcwMH0.IkwXKJkmJiArWyOToTURtAS1RpmcDCHa7cgF2gYX-PY'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testFetch() {
  const jornadaId = '564c3dd0-71bc-4021-b282-c7abe1036d59'
  const { data: ses, error } = await supabase
    .from('sesiones')
    .select('*, dias_jornada(fecha, nombre_dia)')
    .eq('jornada_id', jornadaId)
  
  if (error) {
    console.error(error)
    return
  }
  
  console.log('Sample session:', JSON.stringify(ses[0], null, 2))
  const today = new Date().toISOString().split('T')[0]
  console.log('Today:', today)
  const filtered = ses.filter(s => s.dias_jornada?.fecha === today)
  console.log('Filtered count:', filtered.length)
}

testFetch()

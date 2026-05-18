import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkActiveJornada() {
  const { data, error } = await supabase
    .from('jornadas')
    .select('*, dias_jornada(*)')
    .eq('estado', 'activa')
    .single()
  
  if (error) {
    console.error('Error fetching active jornada:', error)
    return
  }
  
  console.log('Active Jornada:', JSON.stringify(data, null, 2))
}

checkActiveJornada()

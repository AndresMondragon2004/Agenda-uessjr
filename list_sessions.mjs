import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envParams = fs.readFileSync('.env', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=')
  if (key && val) acc[key] = val.join('=').trim()
  return acc
}, {})

const supabase = createClient(envParams.VITE_SUPABASE_URL, envParams.VITE_SUPABASE_ANON_KEY)

async function main() {
  const { data, error } = await supabase.from('sesiones').select('*').limit(3)
  if (error) console.error(error)
  else console.log(JSON.stringify(data, null, 2))
}
main()

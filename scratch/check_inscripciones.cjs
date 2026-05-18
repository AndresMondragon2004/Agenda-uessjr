const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Checking Sessions for "Manualidades":');
  const { data: manualidades } = await supabase
    .from('sesiones')
    .select('id, nombre')
    .ilike('nombre', '%Manualidades%');
  console.log(manualidades);

  console.log('\nChecking Sessions for "Derechos Digitales":');
  const { data: derechos } = await supabase
    .from('sesiones')
    .select('id, nombre')
    .ilike('nombre', '%Derechos Digitales%');
  console.log(derechos);

  console.log('\nChecking if student b2481102-b0f4-4e5d-8afd-c75276284e17 exists:');
  const { data: student } = await supabase
    .from('estudiantes')
    .select('id, nombre')
    .eq('id', 'b2481102-b0f4-4e5d-8afd-c75276284e17')
    .maybeSingle();
  console.log(student);

  console.log('\nChecking total inscriptions:');
  const { count } = await supabase
    .from('inscripciones')
    .select('*', { count: 'exact', head: true });
  console.log('Total inscriptions:', count);
}

check();

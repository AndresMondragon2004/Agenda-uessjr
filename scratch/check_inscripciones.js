import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ydcybysimlvatvadpbaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY3lieXNpbWx2YXR2YWRwYmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTU3MDAsImV4cCI6MjA5Mjg5MTcwMH0.IkwXKJkmJiArWyOToTURtAS1RpmcDCHa7cgF2gYX-PY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    console.log('--- Checking Sessions ---');
    const { data: manualidades } = await supabase
      .from('sesiones')
      .select('id, nombre')
      .ilike('nombre', '%Manualidades%');
    console.log('Manualidades:', manualidades);

    const { data: derechos } = await supabase
      .from('sesiones')
      .select('id, nombre')
      .ilike('nombre', '%Derechos Digitales%');
    console.log('Derechos Digitales:', derechos);

    console.log('\n--- Checking Student ---');
    const { data: student } = await supabase
      .from('estudiantes')
      .select('id, nombre')
      .eq('id', 'b2481102-b0f4-4e5d-8afd-c75276284e17')
      .maybeSingle();
    console.log('Student b2481102...:', student);

    console.log('\n--- Checking Inscriptions ---');
    const { count, error: countError } = await supabase
      .from('inscripciones')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error fetching inscriptions count:', countError);
    } else {
      console.log('Total inscriptions:', count);
    }

    const { data: samples } = await supabase
      .from('inscripciones')
      .select('*, estudiantes(nombre), sesiones(nombre)')
      .limit(5);
    console.log('Sample inscriptions:', JSON.stringify(samples, null, 2));

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

check();

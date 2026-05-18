import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ydcybysimlvatvadpbaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY3lieXNpbWx2YXR2YWRwYmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTU3MDAsImV4cCI6MjA5Mjg5MTcwMH0.IkwXKJkmJiArWyOToTURtAS1RpmcDCHa7cgF2gYX-PY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIds() {
  const studentId = '148d16fe-a5f7-4fd9-b8d9-41d4762a794b';
  const sesionId = 'e8b5e7da-fc4e-43da-8c6d-c045cfaedde2';

  console.log('--- Checking Student ID ---');
  const { data: student } = await supabase
    .from('estudiantes')
    .select('id, nombre')
    .eq('id', studentId)
    .maybeSingle();
  console.log(`Student ${studentId}:`, student);

  console.log('\n--- Checking Session ID ---');
  const { data: sesion } = await supabase
    .from('sesiones')
    .select('id, nombre')
    .eq('id', sesionId)
    .maybeSingle();
  console.log(`Session ${sesionId}:`, sesion);

  console.log('\n--- Checking All Sessions ---');
  const { data: allSesiones } = await supabase
    .from('sesiones')
    .select('id, nombre');
  console.log('Total sessions:', allSesiones.length);
  console.log('Sample sessions:', allSesiones.slice(0, 10));
}

checkIds();

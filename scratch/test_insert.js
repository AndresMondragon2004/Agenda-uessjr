import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ydcybysimlvatvadpbaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY3lieXNpbWx2YXR2YWRwYmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTU3MDAsImV4cCI6MjA5Mjg5MTcwMH0.IkwXKJkmJiArWyOToTURtAS1RpmcDCHa7cgF2gYX-PY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  try {
    const studentId = 'b2481102-b0f4-4e5d-8afd-c75276284e17'; // Karla
    const sesionId = '0a240501-dc25-49f3-bb02-12fbe0a6e880'; // Taller de Manualidades

    console.log(`Attempting to insert inscription for student ${studentId} and session ${sesionId}...`);
    
    const { data, error } = await supabase
      .from('inscripciones')
      .insert([
        { 
          id: 'da219bee-64cb-4e29-b513-b20b0e7d6760', // Specified by user
          estudiante_id: studentId, 
          sesion_id: sesionId, 
          estado: 'confirmada' 
        }
      ])
      .select();

    if (error) {
      console.error('Insert error:', error);
    } else {
      console.log('Insert success:', data);
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testInsert();

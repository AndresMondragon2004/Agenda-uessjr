import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ydcybysimlvatvadpbaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY3lieXNpbWx2YXR2YWRwYmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTU3MDAsImV4cCI6MjA5Mjg5MTcwMH0.IkwXKJkmJiArWyOToTURtAS1RpmcDCHa7cgF2gYX-PY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listStudents() {
  const { data, count } = await supabase
    .from('estudiantes')
    .select('*', { count: 'exact' });
  
  console.log('Total students:', count);
  console.log('First 5 students:', data.slice(0, 5));
  
  const { data: insc } = await supabase
    .from('inscripciones')
    .select('*');
  console.log('Total inscriptions found:', insc.length);
}

listStudents();

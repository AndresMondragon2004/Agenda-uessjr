import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ydcybysimlvatvadpbaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY3lieXNpbWx2YXR2YWRwYmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTU3MDAsImV4cCI6MjA5Mjg5MTcwMH0.IkwXKJkmJiArWyOToTURtAS1RpmcDCHa7cgF2gYX-PY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const ids = [
    'b2481102-b0f4-4e5d-8afd-c75276284e17',
    '6965a503-dd2e-4e1c-b18d-486a43388175',
    'a44980c5-36b7-4ca5-b597-4aa7c96946c5',
    'd01f3663-f603-46dc-9f07-bbab651b2ed4',
    '941bc9b1-801d-4167-8e42-a28d5458f896'
  ];

  console.log('Checking students existence:');
  const { data: students } = await supabase
    .from('estudiantes')
    .select('id, nombre')
    .in('id', ids);
  
  console.log('Found students:', students.length, 'out of', ids.length);
  console.log(students);

  const foundIds = students.map(s => s.id);
  const missingIds = ids.filter(id => !foundIds.includes(id));
  console.log('Missing IDs:', missingIds);
}

check();

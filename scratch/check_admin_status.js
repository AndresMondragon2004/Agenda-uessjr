import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ydcybysimlvatvadpbaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY3lieXNpbWx2YXR2YWRwYmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTU3MDAsImV4cCI6MjA5Mjg5MTcwMH0.IkwXKJkmJiArWyOToTURtAS1RpmcDCHa7cgF2gYX-PY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdmin() {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('correo', 'admin@umb.edu.mx')
    .maybeSingle();
  
  if (error) console.error(error);
  else console.log('Admin record:', data);
}

checkAdmin();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ydcybysimlvatvadpbaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY3lieXNpbWx2YXR2YWRwYmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTU3MDAsImV4cCI6MjA5Mjg5MTcwMH0.IkwXKJkmJiArWyOToTURtAS1RpmcDCHa7cgF2gYX-PY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
  const { data: adminData } = await supabase.from('admins').select('*').limit(1);
  if (adminData && adminData.length > 0) {
    const admin = adminData[0];
    console.log('Attempting to update admin:', admin.correo);
    const { error } = await supabase
      .from('admins')
      .update({ activo: admin.activo })
      .eq('id', admin.id);
    
    if (error) {
      console.error('Update failed:', error.message);
    } else {
      console.log('Update succeeded');
    }
  }
}

testUpdate();

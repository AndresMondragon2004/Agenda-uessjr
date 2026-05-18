import { supabase } from '../src/services/supabase.js';

async function testUpdate() {
  // Try to update the first proposal to see what error it throws
  const { data: props, error: e1 } = await supabase.from('propuestas').select('*').limit(1);
  if (e1 || !props.length) {
    console.log("No proposals found or error fetching:", e1);
    return;
  }
  
  const prop = props[0];
  console.log("Found prop:", prop.id);
  
  // Try to update just the updated_at
  const { data, error } = await supabase
    .from('propuestas')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', prop.id)
    .select();
    
  console.log("Update result without single:", { data, error });
}

testUpdate();

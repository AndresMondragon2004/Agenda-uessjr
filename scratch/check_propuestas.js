import { supabase } from '../src/services/supabase.js';

async function test() {
  const { data, error } = await supabase
    .from('propuestas')
    .select('*')
    .limit(1);
  
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

test();

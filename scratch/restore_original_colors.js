import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function restore() {
  const originalBranding = {
    primary_color: "#163020", 
    secondary_color: "#e0a96d", 
    bg_color_light: "#FAF9F6",
    bg_color_dark: "#05140B",
    border_radius: "0.5rem",
    logo_url_light: null, 
    logo_url_dark: null, 
    favicon_url: null,
    background_image_hero: null,
    background_image_login: null
  };

  console.log('Restaurando colores institucionales...');
  
  const { data, error } = await supabase
    .from('system_settings')
    .update({ 
      branding: originalBranding,
      draft_settings: null 
    })
    .eq('id', 1)
    .select();

  if (error) {
    console.error('Error restaurando:', error);
  } else {
    console.log('¡Éxito! Colores restaurados:', data[0].branding);
  }
}

restore();

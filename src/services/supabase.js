import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '[supabase.js] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não configuradas. ' +
    'Adicione essas variáveis no painel da Vercel em Settings → Environment Variables.'
  );
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || ''
);

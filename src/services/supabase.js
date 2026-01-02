import { createClient } from '@supabase/supabase-js';

// ⚠️ SUBSTITUA PELOS SEUS DADOS REAIS DO SUPABASE
const supabaseUrl = 'https://ixaggpnuhtlcnrxlbuiy.supabase.co'; 
const supabaseKey = 'sb_publishable_QqQPSjGQo3RUSaZjT9lxSw_gYMmWwlS';

export const supabase = createClient(supabaseUrl, supabaseKey);
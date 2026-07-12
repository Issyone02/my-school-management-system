import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('=== SUPABASE DEBUG ===');
console.log('URL:', supabaseUrl);
console.log('Key exists:', supabaseAnonKey ? 'YES' : 'NO');
console.log('Key starts with:', supabaseAnonKey.substring(0, 20) + '...');
console.log('=====================');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getServerSupabase = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
  return createClient(supabaseUrl, serviceRoleKey);
};
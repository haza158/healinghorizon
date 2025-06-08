// Supabase client configuration
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2';

// Get environment variables
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 
                   (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
                   'your_supabase_url_here';

const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 
                       (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
                       'your_supabase_anon_key_here';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl !== 'your_supabase_url_here' && 
         supabaseAnonKey !== 'your_supabase_anon_key_here' &&
         supabaseUrl && supabaseAnonKey;
};
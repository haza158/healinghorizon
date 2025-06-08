// Supabase client configuration
import { createClient } from 'https://unpkg.com/@supabase/supabase-js@2.39.0/dist/esm/supabase.mjs';

// Get environment variables - check multiple sources
const getEnvVar = (name) => {
    // Check Vite environment variables
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env[name];
    }
    
    // Check process environment (Node.js)
    if (typeof process !== 'undefined' && process.env) {
        return process.env[name];
    }
    
    // Check window environment (browser)
    if (typeof window !== 'undefined' && window.env) {
        return window.env[name];
    }
    
    return null;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || 'your_supabase_url_here';
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'your_supabase_anon_key_here';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl !== 'your_supabase_url_here' && 
         supabaseAnonKey !== 'your_supabase_anon_key_here' &&
         supabaseUrl && supabaseAnonKey &&
         supabaseUrl.includes('supabase.co');
};

// Log configuration status
console.log('Supabase configured:', isSupabaseConfigured());
if (!isSupabaseConfigured()) {
    console.log('Supabase not configured - using localStorage fallback');
}
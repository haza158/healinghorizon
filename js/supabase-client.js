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
  return supabaseUrl !== 'https://efvxihgndvaevspelpsa.supabase.co' && 
         supabaseAnonKey !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmdnhpaGduZHZhZXZzcGVscHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzOTQ0NTksImV4cCI6MjA2NDk3MDQ1OX0.Nwzeta4FOJGRC0J0xam8AwY6MUbnj7QxDV_MqwsaX2c' &&
         supabaseUrl && supabaseAnonKey &&
         supabaseUrl.includes('supabase.co');
};

// Log configuration status
console.log('Supabase configured:', isSupabaseConfigured());
if (!isSupabaseConfigured()) {
    console.log('Supabase not configured - using localStorage fallback');
}
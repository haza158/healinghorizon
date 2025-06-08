// Supabase client configuration
let supabase = null;
let createClient = null;

// Function to dynamically load Supabase
async function loadSupabase() {
    try {
        // Try to load from jsDelivr CDN (more reliable than unpkg)
        const module = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        createClient = module.createClient;
        return true;
    } catch (error) {
        console.warn('Failed to load Supabase from jsDelivr, trying esm.sh:', error);
        try {
            // Fallback to esm.sh
            const module = await import('https://esm.sh/@supabase/supabase-js@2.39.0');
            createClient = module.createClient;
            return true;
        } catch (error2) {
            console.warn('Failed to load Supabase from esm.sh:', error2);
            return false;
        }
    }
}

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

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || 'https://efvxihgndvaevspelpsa.supabase.co';
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmdnhpaGduZHZhZXZzcGVscHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzOTQ0NTksImV4cCI6MjA2NDk3MDQ1OX0.Nwzeta4FOJGRC0J0xam8AwY6MUbnj7QxDV_MqwsaX2c';

// Initialize Supabase client
async function initializeSupabase() {
    const loaded = await loadSupabase();
    if (loaded && createClient) {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
        console.log('Supabase client initialized successfully');
        return true;
    } else {
        console.log('Supabase could not be loaded - using localStorage fallback');
        return false;
    }
}

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
    return supabase !== null &&
           supabaseUrl !== 'https://efvxihgndvaevspelpsa.supabase.co' && 
           supabaseAnonKey !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmdnhpaGduZHZhZXZzcGVscHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzOTQ0NTksImV4cCI6MjA2NDk3MDQ1OX0.Nwzeta4FOJGRC0J0xam8AwY6MUbnj7QxDV_MqwsaX2c' &&
           supabaseUrl && supabaseAnonKey &&
           supabaseUrl.includes('supabase.co');
};

// Export functions and variables
export { supabase, isSupabaseConfigured, initializeSupabase };
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

// Get the actual Supabase credentials from environment
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Initialize Supabase client
async function initializeSupabase() {
    const loaded = await loadSupabase();
    if (loaded && createClient && supabaseUrl && supabaseAnonKey && supabaseUrl !== 'undefined' && supabaseAnonKey !== 'undefined') {
        try {
            supabase = createClient(supabaseUrl, supabaseAnonKey);
            console.log('Supabase client initialized successfully with URL:', supabaseUrl);
            return true;
        } catch (error) {
            console.warn('Failed to initialize Supabase client:', error);
            return false;
        }
    } else {
        console.log('Supabase credentials not available - using localStorage for community forum');
        return false;
    }
}

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
    return supabase !== null &&
           supabaseUrl && 
           supabaseAnonKey &&
           supabaseUrl !== 'undefined' &&
           supabaseAnonKey !== 'undefined' &&
           supabaseUrl.includes('supabase.co');
};

// Export functions and variables
export { supabase, isSupabaseConfigured, initializeSupabase };
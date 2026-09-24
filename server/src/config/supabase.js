const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = serviceRoleKey || process.env.SUPABASE_KEY;

let supabase = null;

const isSupabaseConfigured = () => {
  return !getSupabaseConfigurationError();
};

const getSupabaseConfigurationError = () => {
  if (!supabaseUrl) return 'SUPABASE_URL is not configured.';
  if (!supabaseKey) return 'SUPABASE_KEY or SUPABASE_SERVICE_ROLE_KEY is not configured.';
  if (!serviceRoleKey && supabaseKey.startsWith('sb_publishable_')) {
    return 'SUPABASE_SERVICE_ROLE_KEY is required for server-side Supabase writes.';
  }
  if (supabaseUrl.includes('your-project.supabase.co')) return 'SUPABASE_URL still uses the placeholder value.';
  if (supabaseKey.includes('your_supabase_')) return 'Supabase key still uses the placeholder value.';
  return null;
};

if (isSupabaseConfigured()) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    console.log(`[Supabase] Initialized client for project URL: ${supabaseUrl}`);
  } catch (err) {
    console.error('[Supabase] Failed to initialize client:', err.message);
  }
} else {
  console.log('[Supabase] Configuration placeholder detected. Local persistent fallback active.');
}

const testSupabaseConnection = async () => {
  if (!isSupabaseConfigured() || !supabase) {
    return { connected: false, message: 'Supabase credentials not set in .env' };
  }
  try {
    const { data, error } = await supabase.from('clubs').select('count').limit(1);
    if (error) throw error;
    return { connected: true, data };
  } catch (err) {
    return { connected: false, error: err.message };
  }
};

module.exports = {
  supabase,
  isSupabaseConfigured,
  getSupabaseConfigurationError,
  testSupabaseConnection
};

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

const isSupabaseConfigured = () => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseKey) &&
    !supabaseUrl.includes('your-project.supabase.co') &&
    !supabaseKey.includes('your_supabase_')
  );
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
  testSupabaseConnection
};

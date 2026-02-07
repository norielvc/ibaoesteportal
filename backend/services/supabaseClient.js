const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase;

if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️ Supabase credentials missing! The server will start but database features will fail.');
  console.error('URL Present:', !!supabaseUrl);
  console.error('Key Present:', !!supabaseKey);
  supabase = null;
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase Client initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase:', error.message);
    supabase = null;
  }
}

// Initialized above

module.exports = { supabase };
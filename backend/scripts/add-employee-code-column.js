const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumn() {
  const sql = `ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_code VARCHAR(3);`;
  console.log('Attempting to add employee_code column to users table...');

  try {
    // Try via rpc exec_sql if it exists
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error via RPC:', error.message);
      console.log('--- MANUAL ACTION REQUIRED ---');
      console.log('Please run the following SQL in your Supabase SQL Editor:');
      console.log(sql);
    } else {
      console.log('Successfully added column via RPC');
    }
  } catch (err) {
    console.error('RPC failed:', err.message);
    console.log('--- MANUAL ACTION REQUIRED ---');
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log(sql);
  }
}

addColumn();

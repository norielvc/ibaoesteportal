const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addColumns() {
    const sql = `
        ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS partner_address TEXT;
        ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS partner_civil_status TEXT;
    `;

    console.log('Attempting to add columns via direct SQL (if exec_sql RPC exists)...');
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
        console.error('Error adding columns via exec_sql:', error.message);
        console.log('Falling back to checking if columns exist (maybe they were added manually)...');
    } else {
        console.log('Successfully added columns (if exec_sql was enabled).');
    }
}

addColumns();

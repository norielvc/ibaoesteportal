const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function executeSql() {
    const sql = `ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;`;
    console.log('Executing SQL:', sql);

    // Try using the exec_sql RPC if available
    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql });
        if (error) {
            console.error('RPC Error:', error);
        } else {
            console.log('Success via RPC');
            return;
        }
    } catch (e) {
        console.log('RPC failed, likely not available.');
    }

    console.log('--- MANUAL ACTION REQUIRED ---');
    console.log('Since the RPC function "exec_sql" is not available, you must run this SQL manually in your Supabase SQL Editor:');
    console.log(sql);
}

executeSql();

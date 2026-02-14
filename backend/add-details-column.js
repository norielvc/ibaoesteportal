const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addDetailsColumn() {
    console.log('Adding "details" column to certificate_requests table...');

    const sql = `
        ALTER TABLE certificate_requests 
        ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;
    `;

    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql });

        if (error) {
            console.error('Error adding "details" column via exec_sql:', error);
            console.log('If "exec_sql" is not enabled, please run this SQL in your Supabase SQL Editor:');
            console.log(sql);
        } else {
            console.log('Successfully added "details" column.');
        }

    } catch (e) {
        console.error('Unexpected error:', e);
    }
}

addDetailsColumn();

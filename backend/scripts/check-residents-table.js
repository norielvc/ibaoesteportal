const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function initTable() {
    console.log('Initializing residents table...');

    // We use rpc call to create table if we have a function for it, 
    // but usually we just use regular SQL. 
    // Since we can't run raw SQL easily via client without an RPC, 
    // we'll just check if the table exists by trying to fetch from it.

    const { error } = await supabase
        .from('residents')
        .select('id')
        .limit(1);

    if (error && error.code === 'PGRST116') {
        console.log('Table "residents" does not exist.');
        console.log('IMPORTANT: Please run the SQL in CREATE_RESIDENTS_TABLE.sql in your Supabase Dashboard SQL Editor.');
    } else if (error) {
        console.error('Error checking table:', error);
    } else {
        console.log('Table "residents" already exists and is reachable.');
    }
}

initTable();

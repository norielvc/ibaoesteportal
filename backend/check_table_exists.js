const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    console.log('Checking if workflow_history table exists...');

    const { data, error } = await supabase
        .from('workflow_history')
        .select('count', { count: 'exact', head: true });

    if (error) {
        console.error('❌ Error accessing workflow_history table:');
        console.error(error.message);
        if (error.message.includes('does not exist')) {
            console.log('\n💡 DIAGNOSIS: The table "workflow_history" DOES NOT EXIST. You need to run the SQL script.');
        }
    } else {
        console.log('✅ Success! "workflow_history" table exists.');
    }
}

checkTable();

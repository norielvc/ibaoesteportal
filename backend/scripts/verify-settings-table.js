const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in backend/.env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseState() {
    console.log('🔍 Checking database state...');
    console.log('URL:', supabaseUrl);

    // 1. Check if 'barangay_settings' table exists by trying to select from it
    const { data, error } = await supabase
        .from('barangay_settings')
        .select('*')
        .limit(1);

    if (error) {
        if (error.code === 'PGRST205' || error.message.includes('does not exist')) {
            console.error('\n❌ CRITICAL: The table "barangay_settings" DOES NOT EXIST.');
            console.error('   The new features will NOT work until this table is created.');
            console.error('   Please verify you ran the SQL script in Supabase Dashboard.');
        } else {
            console.error('❌ Error checking table:', error.message);
        }
    } else {
        console.log('✅ Table "barangay_settings" exists!');
        console.log('   Row count:', data.length);
    }
}

checkDatabaseState();

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking residents table columns...');
    const { data, error } = await supabase
        .from('residents')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching from residents:', error.message);
        if (error.message.includes('pending_case')) {
            console.log('--- CONFIRMED: column "pending_case" is missing! ---');
        }
    } else if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log('Available columns:', columns);
        if (!columns.includes('pending_case')) {
            console.log('--- MISSING: pending_case ---');
        }
        if (!columns.includes('case_record_history')) {
            console.log('--- MISSING: case_record_history ---');
        }
    } else {
        console.log('Residents table is empty, cannot check columns this way.');
    }
}

checkSchema();

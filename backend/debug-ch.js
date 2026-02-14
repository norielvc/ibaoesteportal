const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkCH00001() {
    const { data, error } = await supabase
        .from('certificate_requests')
        .select('*')
        .eq('reference_number', 'CH-2026-00001')
        .single();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('--- CH-2026-00001 RAW DATA ---');
        for (const [key, value] of Object.entries(data)) {
            console.log(`${key}: ${JSON.stringify(value)} (${typeof value})`);
        }
    }
}

checkCH00001();

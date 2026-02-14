const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkJson() {
    const { data, error } = await supabase
        .from('certificate_requests')
        .select('*')
        .eq('reference_number', 'CH-2026-00001')
        .single();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('JSON for CH-2026-00001:');
        console.log(JSON.stringify(data, null, 2));
    }
}

checkJson();

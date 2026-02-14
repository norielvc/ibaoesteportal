const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectRequest() {
    console.log('Inspecting SP-2026-00001...');

    const { data, error } = await supabase
        .from('certificate_requests')
        .select('*')
        .eq('reference_number', 'SP-2026-00001')
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Request details:', JSON.stringify(data, null, 2));
}

inspectRequest();

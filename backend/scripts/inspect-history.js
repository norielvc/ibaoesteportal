const path = require('path');
const fs = require('fs');

// Robust env loading
const envPath = path.join(__dirname, '..', '.env');
const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
for (const k in envConfig) process.env[k] = envConfig[k];

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectHistory(requestId) {
    console.log(`🔍 Inspecting history for request: ${requestId}`);

    const { data: history, error: hError } = await supabase
        .from('workflow_history')
        .select('*')
        .eq('request_id', requestId);

    if (hError) console.error('Error fetching workflow_history:', hError);
    else {
        console.log('--- workflow_history rows ---');
        console.log(JSON.stringify(history, null, 2));
    }

    const { data: assignments, error: aError } = await supabase
        .from('workflow_assignments')
        .select('*')
        .eq('request_id', requestId);

    if (aError) console.error('Error fetching workflow_assignments:', aError);
    else {
        console.log('--- workflow_assignments rows ---');
        console.log(JSON.stringify(assignments, null, 2));
    }
}

async function run() {
    const { data: request } = await supabase
        .from('certificate_requests')
        .select('id, reference_number')
        .eq('reference_number', 'ND-2026-00002')
        .single();

    if (request) {
        await inspectHistory(request.id);
    } else {
        console.log('ND-2026-00002 not found.');
    }
}

run();

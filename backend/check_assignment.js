const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
    const requestId = 'd0228bd9-8324-4da0-a189-e8f5616395e8';
    console.log('Checking assignment for Request:', requestId);

    const { data, error } = await supabase
        .from('workflow_assignments')
        .select('*')
        .eq('request_id', requestId);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Found Assignments:', JSON.stringify(data, null, 2));
}

check();

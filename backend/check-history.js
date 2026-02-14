const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkHistory() {
    // 1. Get the ID for CH-2026-00002
    const { data: request, error: reqError } = await supabase
        .from('certificate_requests')
        .select('id, reference_number, full_name, status')
        .eq('reference_number', 'CH-2026-00001')
        .single();

    if (reqError) {
        console.error('Error fetching request:', reqError);
        return;
    }

    console.log('--- Request Info ---');
    console.log(JSON.stringify(request, null, 2));

    const requestId = request.id;

    // 2. Check workflow_history
    const { data: history, error: historyError } = await supabase
        .from('workflow_history')
        .select('*')
        .eq('request_id', requestId);

    if (historyError) {
        console.error('Error fetching history:', historyError);
    } else {
        console.log('--- Workflow History ---');
        console.log(JSON.stringify(history, null, 2));
    }

    // 3. Check workflow_assignments
    const { data: assignments, error: assignError } = await supabase
        .from('workflow_assignments')
        .select('*')
        .eq('request_id', requestId);

    if (assignError) {
        console.error('Error fetching assignments:', assignError);
    } else {
        console.log('--- Workflow Assignments ---');
        console.log(JSON.stringify(assignments, null, 2));
    }
}

checkHistory();

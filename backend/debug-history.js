const { supabase } = require('./services/supabaseClient');

async function debugHistory() {
    console.log('Debugging Workflow History for BR-2026-00008...');

    try {
        // 1. Get the Request ID
        const { data: request, error: reqError } = await supabase
            .from('certificate_requests')
            .select('id, status, reference_number')
            .ilike('reference_number', '%BR-2026-00008%')
            .single();

        if (reqError) {
            console.error('Error finding request:', reqError);
            return;
        }

        if (!request) {
            console.error('Request BR-2026-00008 not found.');
            return;
        }

        console.log('✅ Found Request:', request);

        // 2. Get Workflow History
        const { data: history, error: histError } = await supabase
            .from('workflow_history')
            .select('*')
            .eq('request_id', request.id);

        if (histError) {
            console.error('Error fetching history:', histError);
        } else {
            console.log(`✅ Found ${history.length} history entries:`);
            console.log(JSON.stringify(history, null, 2));
        }

        // 3. Get Assignments (to see who worked on it)
        const { data: assignments, error: assignError } = await supabase
            .from('workflow_assignments')
            .select('*')
            .eq('request_id', request.id);

        if (assignError) {
            console.error('Error fetching assignments:', assignError);
        } else {
            console.log(`✅ Found ${assignments.length} assignments:`);
            console.log(JSON.stringify(assignments, null, 2));
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

debugHistory();

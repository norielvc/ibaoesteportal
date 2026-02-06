const { supabase } = require('./services/supabaseClient');

async function check() {
    try {
        // Find all requests with status 'pending' or 'staff_review'
        const { data: requests, error } = await supabase
            .from('certificate_requests')
            .select('id, reference_number, status')
            .in('status', ['pending', 'staff_review']);

        if (error) throw error;

        console.log(`Checking ${requests.length} requests for return history...`);

        for (const req of requests) {
            const { data: history } = await supabase
                .from('workflow_history')
                .select('action')
                .eq('request_id', req.id)
                .eq('action', 'return')
                .limit(1);

            if (history && history.length > 0) {
                console.log(`Request ${req.reference_number} was RETURNED but status is ${req.status}`);
            }
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
    process.exit(0);
}

check();

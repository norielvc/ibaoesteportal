const { supabase } = require('./services/supabaseClient');

async function repair() {
    try {
        console.log('Starting repair of returned requests...');

        // 1. Get all history entries with action 'return'
        const { data: history, error: hError } = await supabase
            .from('workflow_history')
            .select('request_id')
            .eq('action', 'return');

        if (hError) throw hError;

        const returnedIds = [...new Set(history.map(h => h.request_id))];
        console.log(`Found ${returnedIds.length} requests that were ever returned.`);

        // 2. Update those that are currently pending/staff_review to 'returned'
        let count = 0;
        for (const id of returnedIds) {
            const { data: req } = await supabase
                .from('certificate_requests')
                .select('status, reference_number')
                .eq('id', id)
                .single();

            if (req && (req.status === 'pending' || req.status === 'staff_review')) {
                console.log(`Updating ${req.reference_number} to 'returned'...`);
                const { error: uError } = await supabase
                    .from('certificate_requests')
                    .update({ status: 'returned' })
                    .eq('id', id);

                if (uError) console.error(`Failed to update ${id}:`, uError.message);
                else count++;
            }
        }

        console.log(`Successfully repaired ${count} requests.`);

    } catch (err) {
        console.error('Error:', err.message);
    }
    process.exit(0);
}

repair();

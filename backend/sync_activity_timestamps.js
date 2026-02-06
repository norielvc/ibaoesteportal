const { supabase } = require('./services/supabaseClient');

async function sync() {
    try {
        console.log('🔄 Syncing "Last Activity" timestamps with history...');

        // 1. Get all requests
        const { data: requests, error: rError } = await supabase
            .from('certificate_requests')
            .select('id, reference_number, created_at, updated_at');

        if (rError) throw rError;

        let totalUpdated = 0;

        for (const req of requests) {
            // 2. Get latest history entry for this request
            const { data: history, error: hError } = await supabase
                .from('workflow_history')
                .select('created_at')
                .eq('request_id', req.id)
                .order('created_at', { ascending: false })
                .limit(1);

            if (hError) {
                console.error(`Error fetching history for ${req.reference_number}:`, hError.message);
                continue;
            }

            const latestHistoryTime = history && history.length > 0 ? history[0].created_at : null;
            const currentUpdatedAt = req.updated_at || req.created_at;

            // If history is newer than current updated_at, sync it
            if (latestHistoryTime && new Date(latestHistoryTime) > new Date(currentUpdatedAt)) {
                console.log(`Updating ${req.reference_number}: ${currentUpdatedAt} -> ${latestHistoryTime} (from history)`);

                const { error: uError } = await supabase
                    .from('certificate_requests')
                    .update({ updated_at: latestHistoryTime })
                    .eq('id', req.id);

                if (uError) {
                    console.error(`Failed to update ${req.reference_number}:`, uError.message);
                } else {
                    totalUpdated++;
                }
            }
        }

        console.log(`✅ Sync complete. Updated ${totalUpdated} requests.`);

    } catch (err) {
        console.error('Error:', err.message);
    }
    process.exit(0);
}

sync();

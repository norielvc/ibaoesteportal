const { supabase } = require('./services/supabaseClient');

async function sync() {
    try {
        console.log('🔄 Syncing "Last Activity" timestamps with ALL events...');

        const { data: requests, error: rError } = await supabase
            .from('certificate_requests')
            .select('id, reference_number, created_at, updated_at');

        if (rError) throw rError;

        let totalUpdated = 0;

        for (const req of requests) {
            // 1. Get latest history entry
            const { data: history } = await supabase
                .from('workflow_history')
                .select('created_at')
                .eq('request_id', req.id)
                .order('created_at', { ascending: false })
                .limit(1);

            // 2. Get latest assignment completion
            const { data: assignments } = await supabase
                .from('workflow_assignments')
                .select('completed_at')
                .eq('request_id', req.id)
                .order('completed_at', { ascending: false })
                .limit(1);

            const hTime = (history && history.length > 0) ? history[0].created_at : null;
            const aTime = (assignments && assignments.length > 0) ? assignments[0].completed_at : null;

            // Find the latest of all three
            let latest = req.created_at;
            if (hTime && new Date(hTime) > new Date(latest)) latest = hTime;
            if (aTime && new Date(aTime) > new Date(latest)) latest = aTime;

            const currentUpdatedAt = req.updated_at || req.created_at;

            // If we found something newer than what's currently marked as updated_at
            if (new Date(latest) > new Date(currentUpdatedAt)) {
                console.log(`Updating ${req.reference_number}: ${currentUpdatedAt} -> ${latest}`);

                const { error: uError } = await supabase
                    .from('certificate_requests')
                    .update({ updated_at: latest })
                    .eq('id', req.id);

                if (!uError) totalUpdated++;
            }
        }

        console.log(`✅ Sync complete. Updated ${totalUpdated} requests.`);

    } catch (err) {
        console.error('Error:', err.message);
    }
    process.exit(0);
}

sync();

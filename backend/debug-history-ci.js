const { supabase } = require('./services/supabaseClient');

async function debugHistory(refNo) {
    console.log(`Debugging Workflow History for ${refNo}...`);

    try {
        // 1. Get the Request ID
        const { data: request, error: reqError } = await supabase
            .from('certificate_requests')
            .select('id, status, reference_number')
            .ilike('reference_number', `%${refNo}%`)
            .single();

        if (reqError) {
            console.error('Error finding request:', reqError);
            return;
        }

        console.log('✅ Found Request:', request);

        // 2. Get Workflow History with User data
        const { data: history, error: histError } = await supabase
            .from('workflow_history')
            .select('*, users:performed_by (id, first_name, last_name, employee_code, role)')
            .eq('request_id', request.id)
            .order('created_at', { ascending: true });

        if (histError) {
            console.error('Error fetching history:', histError);
        } else {
            console.log(`✅ Found ${history.length} history entries:`);
            history.forEach(h => {
                console.log(`[${h.created_at}] Action: ${h.action}, Step: ${h.step_name}, By: ${h.users?.first_name} ${h.users?.last_name}, Role: ${h.users?.role}, Code: ${h.users?.employee_code || 'MISSING'}`);
            });
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

debugHistory('CI-2026-91256');

const { supabase } = require('./services/supabaseClient');

async function debugHistorySignatures(refNo) {
    console.log(`Checking Signatures in Workflow History for ${refNo}...`);
    try {
        const { data: request } = await supabase
            .from('certificate_requests')
            .select('id')
            .ilike('reference_number', `%${refNo}%`)
            .single();

        if (!request) return;

        const { data: history } = await supabase
            .from('workflow_history')
            .select('id, action, step_name, signature_data, users:performed_by(first_name, last_name)')
            .eq('request_id', request.id);

        history.forEach(h => {
            const hasSig = h.signature_data ? `YES (${h.signature_data.length} chars)` : 'NO';
            console.log(`[${h.step_name}] ${h.users?.first_name} ${h.users?.last_name}: Action=${h.action}, HasSignature=${hasSig}`);
            if (h.signature_data && h.signature_data.length < 100) {
                console.log(`   Signature Data: "${h.signature_data}"`);
            }
        });
    } catch (err) {
        console.error(err);
    }
}

debugHistorySignatures('CI-2026-91256');

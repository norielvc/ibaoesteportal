const { supabase } = require('./services/supabaseClient');

async function debug() {
    const ref = 'BR-2026-00007';
    try {
        const { data: req } = await supabase
            .from('certificate_requests')
            .select('*')
            .eq('reference_number', ref)
            .single();

        console.log(`Request: ${ref}`);
        console.log(`Created: ${req.created_at}`);
        console.log(`Updated: ${req.updated_at}`);

        const { data: history } = await supabase
            .from('workflow_history')
            .select('*')
            .eq('request_id', req.id)
            .order('created_at', { ascending: false });

        console.log('History:');
        history.forEach(h => {
            console.log(`  ${h.created_at} | Action: ${h.action} | Comment: ${h.comments}`);
        });

    } catch (err) {
        console.error('Error:', err.message);
    }
    process.exit(0);
}

debug();

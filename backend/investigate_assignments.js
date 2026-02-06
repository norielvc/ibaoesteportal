const { supabase } = require('./services/supabaseClient');

async function check() {
    try {
        const { data: assignments, error } = await supabase
            .from('workflow_assignments')
            .select('*')
            .in('request_id', ['455047b1-e23e-469b-8919-6f97ef050b4c', 'b170c061-00fd-4977-bad8-d6a0694e99f5']) // I need to get IDs from Refs
            .eq('status', 'pending');

        // I'll get by reference number instead
        const { data: reqs } = await supabase.from('certificate_requests').select('id, reference_number').in('reference_number', ['BC-2026-00022', 'BR-2026-00007']);
        const ids = reqs.map(r => r.id);

        const { data: assignments2 } = await supabase
            .from('workflow_assignments')
            .select('*')
            .in('request_id', ids)
            .eq('status', 'pending');

        console.log('--- ASSIGNMENTS FOR RETURNED REQUESTS ---');
        assignments2.forEach(a => {
            console.log(`Req: ${a.request_id} | Assigned To: ${a.assigned_user_id} | Step: ${a.step_name}`);
        });

    } catch (err) {
        console.error('Error:', err.message);
    }
    process.exit(0);
}

check();

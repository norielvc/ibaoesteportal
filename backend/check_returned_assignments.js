const { supabase } = require('./services/supabaseClient');

async function check() {
    try {
        const { data: assignments, error } = await supabase
            .from('workflow_assignments')
            .select('*, certificate_requests(*)')
            .eq('status', 'pending')
            .eq('certificate_requests.status', 'returned');

        if (error) throw error;

        console.log('--- PENDING ASSIGNMENTS WITH RETURNED STATUS ---');
        assignments.filter(a => a.certificate_requests).forEach(a => {
            console.log(`Ref: ${a.certificate_requests.reference_number} | Assigned To: ${a.assigned_user_id} | Step: ${a.step_name}`);
        });

    } catch (err) {
        console.error('Error:', err.message);
    }
    process.exit(0);
}

check();

const { supabase } = require('./backend/services/supabaseClient');

async function check() {
    // Get all pending assignments
    const { data: assignments, error } = await supabase
        .from('workflow_assignments')
        .select('*, certificate_requests(id, reference_number, status)')
        .eq('status', 'pending');

    if (error) {
        console.error('Error:', error);
        process.exit(1);
    }

    console.log('--- ALL PENDING ASSIGNMENTS ---');
    assignments.forEach(a => {
        console.log(`Ref: ${a.certificate_requests?.reference_number} | Req Status: ${a.certificate_requests?.status} | Step: ${a.step_name} | Assigned To: ${a.assigned_user_id}`);
    });

    process.exit(0);
}

check();

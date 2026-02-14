const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const LUFFY_ID = '1b1a2e3b-eb05-4de9-b792-4c330ca1d9ae';
const NORIEL_ID = '9550a8b2-9e32-4f52-a260-52766afb49b1';

async function fixAssignments() {
    console.log('Fixing workflow assignments for "Certification of Same Person" requests...');

    // 1. Find all requests that are 'certification_same_person'
    const { data: requests, error: fetchError } = await supabase
        .from('certificate_requests')
        .select('id, reference_number')
        .eq('certificate_type', 'certification_same_person');

    if (fetchError) {
        console.error('Error fetching requests:', fetchError);
        return;
    }

    console.log(`Found ${requests.length} requests.`);

    for (const req of requests) {
        console.log(`Checking assignments for ${req.reference_number} (${req.id})...`);

        // Check assigned user
        const { data: assignments, error: assignError } = await supabase
            .from('workflow_assignments')
            .select('*')
            .eq('request_id', req.id);

        if (assignments && assignments.length > 0) {
            console.log('Current assignments:', assignments.map(a => a.assigned_user_id));

            // Delete existing wrong assignments
            const { error: delError } = await supabase
                .from('workflow_assignments')
                .delete()
                .eq('request_id', req.id);

            if (!delError) {
                console.log('Deleted old assignments.');
            }
        }

        // Create new assignment for Luffy
        const { error: insertError } = await supabase
            .from('workflow_assignments')
            .insert([{
                request_id: req.id,
                request_type: 'certification_same_person',
                step_id: 111,
                step_name: 'Review Request',
                assigned_user_id: LUFFY_ID,
                status: 'pending'
            }]);

        if (insertError) {
            console.error('Error inserting new assignment:', insertError);
        } else {
            console.log(`Successfully assigned ${req.reference_number} to Luffy Dono.`);
        }
    }
}

fixAssignments();

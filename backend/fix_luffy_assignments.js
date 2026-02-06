const { supabase } = require('./services/supabaseClient');

async function fix() {
    try {
        console.log('Fixing assignments for Luffy Dono...');
        const luffyId = '1b1a2e3b-eb05-4de9-b792-4c330ca1d9ae';

        // 1. Find all pending assignments for Step 1 (Review Request Team) assigned to others
        const { data: assignments, error } = await supabase
            .from('workflow_assignments')
            .select('*')
            .eq('step_id', '111') // 111 is the ID for Review Request Team
            .eq('status', 'pending');

        if (error) throw error;

        const requestIds = [...new Set(assignments.map(a => a.request_id))];
        console.log(`Found ${requestIds.length} requests in Review Request Team step.`);

        for (const requestId of requestIds) {
            // Check if Luffy is already assigned
            const { data: existing } = await supabase
                .from('workflow_assignments')
                .select('id')
                .eq('request_id', requestId)
                .eq('assigned_user_id', luffyId)
                .eq('status', 'pending')
                .single();

            if (!existing) {
                console.log(`Assigning Luffy to request ${requestId}...`);
                const { data: firstAssignment } = assignments.find(a => a.request_id === requestId);

                const { error: insError } = await supabase
                    .from('workflow_assignments')
                    .insert([{
                        request_id: requestId,
                        request_type: assignments.find(a => a.request_id === requestId).request_type,
                        step_id: '111',
                        step_name: 'Review Request Team',
                        assigned_user_id: luffyId,
                        status: 'pending'
                    }]);

                if (insError) console.error(`Failed to assign Luffy to ${requestId}:`, insError.message);
            }
        }

        console.log('Done fixing assignments.');

    } catch (err) {
        console.error('Error:', err.message);
    }
    process.exit(0);
}

fix();

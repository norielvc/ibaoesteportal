const { supabase } = require('./services/supabaseClient');

async function check() {
    const userId = 'ca847635-fd64-4e69-9cc7-01998200ddfe';
    try {
        const { data: assignments, error } = await supabase
            .from('workflow_assignments')
            .select('*, certificate_requests(*)')
            .eq('assigned_user_id', userId)
            .eq('status', 'pending');

        if (error) throw error;

        console.log(`--- PENDING ASSIGNMENTS FOR USER ${userId} ---`);
        console.log(`Count: ${assignments.length}`);

        const statusCounts = {};
        assignments.forEach(a => {
            const status = a.certificate_requests?.status;
            statusCounts[status] = (statusCounts[status] || 0) + 1;
            if (status === 'returned') {
                console.log(`FOUND RETURNED: ${a.certificate_requests.reference_number}`);
            }
        });

        console.log('Status breakdown of certificate requests:');
        console.log(JSON.stringify(statusCounts, null, 2));

    } catch (err) {
        console.error('Error:', err.message);
    }
    process.exit(0);
}

check();

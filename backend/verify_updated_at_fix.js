const { supabase } = require('./services/supabaseClient');

async function verify() {
    const userId = '1b1a2e3b-eb05-4de9-b792-4c330ca1d9ae'; // Luffy
    try {
        const { data, error } = await supabase
            .from('workflow_assignments')
            .select(`
                *,
                certificate_requests:request_id (
                    id, reference_number, updated_at, created_at
                )
            `)
            .eq('assigned_user_id', userId)
            .limit(1);

        if (error) throw error;

        console.log('--- API RESPONSE VERIFICATION ---');
        const req = data[0].certificate_requests;
        console.log(`Ref: ${req.reference_number}`);
        console.log(`Has updated_at: ${req.updated_at !== undefined}`);
        console.log(`Value: ${req.updated_at}`);

    } catch (err) {
        console.error('Error:', err.message);
    }
    process.exit(0);
}

verify();

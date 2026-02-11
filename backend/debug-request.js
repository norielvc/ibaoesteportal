const { supabase } = require('./services/supabaseClient');

async function debugRequest() {
    const { data, error } = await supabase
        .from('certificate_requests')
        .select('*')
        .eq('reference_number', 'GD-2026-00003')
        .single();

    if (error) {
        console.error('Error fetching request:', error);
        return;
    }

    console.log('--- Request Debug Info ---');
    console.log('Reference Number:', data.reference_number);
    console.log('Guardian Name:', data.guardian_name);
    console.log('Guardian Relationship:', data.guardian_relationship);
    console.log('Full Data Keys:', Object.keys(data));
    console.log('-------------------------');
}

debugRequest();

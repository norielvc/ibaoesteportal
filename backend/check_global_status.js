const { supabase } = require('./services/supabaseClient');

async function check() {
    try {
        const { data, error } = await supabase
            .from('certificate_requests')
            .select('status');

        if (error) throw error;

        const counts = {};
        data.forEach(r => counts[r.status] = (counts[r.status] || 0) + 1);
        console.log('Status counts in certificate_requests:');
        console.log(JSON.stringify(counts, null, 2));

    } catch (err) {
        console.error('Error:', err.message);
    }
    process.exit(0);
}

check();

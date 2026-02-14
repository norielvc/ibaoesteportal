const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkColumns() {
    const { data, error } = await supabase
        .from('certificate_requests')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else {
        const firstRow = data[0] || {};
        console.log('Available columns in certificate_requests:');
        console.log(Object.keys(firstRow).sort());
    }
}

checkColumns();

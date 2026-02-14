const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkHistoryTypes() {
    console.log('Checking distinct request types in workflow_history...');

    // Using a raw query via rpc to get distinct types if possible, or just fetching all and distincting in JS for simplicity (assuming not millions of rows)
    // Since exec_sql is broken, I have to fetch all rows and process locally, which might be heavy.
    // Let's try to just select the column.

    const { data, error } = await supabase
        .from('workflow_history')
        .select('request_type');

    if (error) {
        console.error('Error fetching history:', error);
        return;
    }

    const types = new Set(data.map(d => d.request_type));
    console.log('Existing request types in workflow_history:', Array.from(types));
}

checkHistoryTypes();

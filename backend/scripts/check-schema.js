const path = require('path');
const fs = require('fs');

// Robust env loading
const envPath = path.join(__dirname, '..', '.env');
const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
for (const k in envConfig) process.env[k] = envConfig[k];

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data: history, error: hError } = await supabase
        .from('workflow_history')
        .select('*')
        .limit(1);

    console.log('History data (to see columns):', history);

    // Get table definition using information_schema directly
    const { data: columns, error: cError } = await supabase
        .rpc('get_table_columns', { t_name: 'workflow_history' });

    // If RPC doesn't exist, try query
    if (cError) {
        console.log('RPC failed, trying raw query...');
        const { data: rawCols, error: rawError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type')
            .eq('table_name', 'workflow_history');
        console.log('Columns:', rawCols || rawError);
    } else {
        console.log('Columns:', columns);
    }
}

checkSchema();

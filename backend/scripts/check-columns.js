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

async function checkColumns() {
    const { data: assignments } = await supabase.from('workflow_assignments').select('*').limit(1);
    if (assignments && assignments.length > 0) {
        console.log('workflow_assignments columns:', Object.keys(assignments[0]));
    }

    const { data: configs } = await supabase.from('workflow_configurations').select('*').limit(1);
    if (configs && configs.length > 0) {
        console.log('workflow_configurations columns:', Object.keys(configs[0]));
    }
}

checkColumns();

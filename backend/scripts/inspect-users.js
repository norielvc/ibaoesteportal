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

async function inspectUsers() {
    const { data: users, error } = await supabase
        .from('users')
        .select('*');

    if (error) console.error('Error fetching users:', error);
    else {
        console.log('--- Supabase users ---');
        console.log(JSON.stringify(users, null, 2));
    }
}

inspectUsers();
